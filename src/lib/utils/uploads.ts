import { readdir } from 'node:fs/promises';
import { azureUpload } from '../../storage/azure/upload.js';
import { fmtUploadPath, getFilePath, tracker } from './fs.js';
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

				if (!file.endsWith('.flv')) continue;

				total += 1;

				if (server.config.DVR_DEFAULT_STORAGE === 'azure') {
					// Move this above when/if more storage options are added
					await tracker.add(
						{
							app,
							stream,
							filename: file,
							path,
							storage: 'azure',
							date: new Date().toISOString()
						},
						{ checkExisting: true }
					);

					const uploadPath = fmtUploadPath({
						app,
						stream,
						filename: file
					});

					await azureUpload(uploadPath, path, {
						onComplete: async () => {
							count += 1;
							await tracker.remove(path);
						}
					});
				}
			}
		}
	}

	server.log.info(`uploaded ${count}/${total} files`);
}
