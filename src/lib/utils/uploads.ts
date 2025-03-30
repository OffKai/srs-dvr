import { readdir } from 'node:fs/promises';
import { azureUpload } from '../../storage/azure/upload.js';
import { fmtUploadPath, getFilePath } from './fs.js';
import { server } from '../../server.js';
import { join } from 'node:path';

export async function restartUploads(): Promise<void> {
	server.log.info('restarting uploads');

	let count = 0;
	let total = 0;

	const root = getFilePath(server.config.DVR_DATA_ROOT);
	for (const app of await readdir(root)) {
		const appPath = join(root, app);

		for (const stream of await readdir(appPath)) {
			const streamPath = join(appPath, stream);

			for (const file of await readdir(streamPath)) {
				const path = join(streamPath, file);

				if (!file.endsWith('.flv') || server.tracker.has(path)) {
					continue;
				}

				total += 1;

				if (server.config.DVR_DEFAULT_STORAGE === 'azure') {
					// Move this above when/if more storage options are added
					server.tracker.set(path, {
						app,
						stream,
						filename: file,
						path,
						storage: 'azure',
						date: new Date().toISOString()
					});

					const uploadPath = fmtUploadPath({
						app,
						stream,
						filename: file
					});

					server.metrics?.upload.attempt.inc({ storage: 'azure' });

					await azureUpload(uploadPath, path, {
						onProgress: ({ bytes }) => {
							server.metrics?.upload.bytes.inc({ storage: 'azure' }, bytes);
						},
						onComplete: () => {
							count += 1;
							server.metrics?.upload.success.inc({ storage: 'azure' });
							server.tracker.delete(path);
						},
						onFailure: () => {
							server.metrics?.upload.failure.inc({ storage: 'azure' });
							server.tracker.delete(path);
						}
					});
				}
			}
		}
	}

	if (total === 0) {
		server.log.info('no files to upload');
	} else {
		server.log.info(`uploaded ${count}/${total} files`);
	}
}
