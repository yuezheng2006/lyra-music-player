const DEFAULT_BOOTSTRAP_TIMEOUT_MS = 4_000;

// electron/resilientApiStartup.cjs
// Starts a local API even when optional remote credential bootstrap is unavailable.

function serializeStartupError(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  if (error && typeof error === 'object') {
    for (const key of ['message', 'error', 'statusText', 'code']) {
      const value = error[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
      if (typeof value === 'number') {
        return String(value);
      }
    }
    try {
      const json = JSON.stringify(error);
      if (json && json !== '{}') {
        return json;
      }
    } catch {
      // Fall through to the stable fallback.
    }
  }
  return 'Unknown error';
}

function waitForOptionalBootstrap(task, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(
      () => resolve({ state: 'timeout', error: new Error('Remote bootstrap timed out') }),
      timeoutMs,
    );
  });

  return Promise.race([
    task.then(
      () => ({ state: 'ready', error: null }),
      error => ({ state: 'failed', error }),
    ),
    timeout,
  ]).finally(() => clearTimeout(timeoutId));
}

async function startResilientLocalApi(options) {
  const {
    getFreePort,
    prepareLocalRuntime,
    bootstrapRemoteRuntime,
    serve,
    updateStatus,
    onBootstrapWarning = () => {},
    bootstrapTimeoutMs = DEFAULT_BOOTSTRAP_TIMEOUT_MS,
  } = options;

  updateStatus({ status: 'starting', port: null, error: null });

  try {
    const port = await getFreePort();
    await prepareLocalRuntime();

    const bootstrapTask = Promise.resolve().then(bootstrapRemoteRuntime);
    const bootstrap = await waitForOptionalBootstrap(bootstrapTask, bootstrapTimeoutMs);
    if (bootstrap.state !== 'ready') {
      onBootstrapWarning(bootstrap.error, bootstrap.state);
    }
    if (bootstrap.state === 'timeout') {
      void bootstrapTask.catch(error => onBootstrapWarning(error, 'late-failure'));
    }

    await serve(port);
    updateStatus({ status: 'running', port, error: null });
    return port;
  } catch (error) {
    updateStatus({
      status: 'error',
      port: null,
      error: serializeStartupError(error),
    });
    throw error;
  }
}

module.exports = {
  serializeStartupError,
  startResilientLocalApi,
};
