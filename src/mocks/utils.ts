export async function flushPromises() {
	await new Promise((resolve) => setImmediate(resolve));
}
