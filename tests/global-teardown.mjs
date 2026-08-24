export default async function globalTeardown() {
  try {
    await fetch('http://127.0.0.1:4173/__campushub_test_shutdown');
  } catch {
    // The server may already have been stopped by the test runner.
  }
}
