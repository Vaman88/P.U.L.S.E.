let runtime, salesCsv, inventoryCsv, signalYears, localToday;
const assets = '/frontend/public/';

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'prepare') {
      self.postMessage({ type: 'progress', message: 'Loading the local XGBoost runtime…' });
      const module = await import(new URL(assets + 'pyodide/0.29.4/pyodide.mjs', self.location.origin).href);
      runtime = await module.loadPyodide({ indexURL: assets + 'pyodide/0.29.4/' });
      await runtime.loadPackage(['numpy', 'pandas', 'scikit-learn', 'xgboost']);
      const source = await fetch(assets + 'browser_forecast.py', { cache: 'no-store' });
      if (!source.ok) throw new Error('Could not load the browser model code');
      await runtime.runPythonAsync(await source.text());
      ({ sales_csv: salesCsv, inventory_csv: inventoryCsv, signal_years: signalYears, local_today: localToday } = data);
      runtime.globals.set('sales_csv', salesCsv);
      runtime.globals.set('inventory_csv', inventoryCsv);
      runtime.globals.set('signal_years', signalYears);
      runtime.globals.set('local_today', localToday);
      await runtime.runPythonAsync(`
import json
_sales = _read_sales(sales_csv, today=local_today)
_read_inventory(inventory_csv, _sales, today=local_today)
_end = _sales.date.max()
_start = _end - pd.DateOffset(years=signal_years)
prepared_window = json.dumps({"start_date": _start.date().isoformat(), "end_date": _end.date().isoformat()})
`);
      self.postMessage({ type: 'prepared', window: JSON.parse(runtime.globals.get('prepared_window')) });
      return;
    }
    if (data.type !== 'train' || !runtime || !salesCsv) throw new Error('Prepare both CSV files before training');
    self.postMessage({ type: 'progress', message: 'Training medication models on this device…' });
    runtime.globals.set('payload', JSON.stringify({ sales_csv: salesCsv, inventory_csv: inventoryCsv,
      signal_rows: data.signal_rows, signal_years: signalYears, local_today: localToday }));
    await runtime.runPythonAsync('result = train(payload)');
    self.postMessage({ type: 'success', result: JSON.parse(runtime.globals.get('result')) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({ type: 'error', message: message.trim().split('\n').at(-1) });
  }
};
