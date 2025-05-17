import { readdir } from 'node:fs/promises';
import { azureUpload } from '../../storage/azure/upload.js';
import { fmtUploadPath, resolveFilePath } from './fs.js';
import { server } from '../../server.js';
import { join } from 'node:path';
import { s3Upload } from '../../storage/s3/upload.js';

export async function restartUploads(): Promise<void> {
	let count = 0;
	let total = 0;

	const root = resolveFilePath(server.config.storage.dataRoot);
	if (root === null) {
		server.log.error(`invalid data root: ${server.config.storage.dataRoot}`);
		return;
	}

	server.log.info(`restarting uploads from ${root}`);

	// /data/[app]/[stream]/[file].flv

	for (const app of await readdir(root)) {
		const appPath = join(root, app);

		for (const stream of await readdir(appPath)) {
			const streamPath = join(appPath, stream);

			for (const filename of await readdir(streamPath)) {
				const path = join(streamPath, filename);

				if (!filename.endsWith('.flv') || server.tracker.has(path)) {
					continue;
				}

				total += 1;

				const now = new Date().toISOString();
				const uploadPath = fmtUploadPath({
					app,
					stream,
					filename
				});

				switch (server.config.storage.defaultStorage) {
					case 'azure': {
						server.tracker.set(path, {
							app,
							stream,
							filename,
							path,
							storage: 'azure',
							date: now
						});

						server.metrics?.upload.attempt.inc({ storage: 'azure' });

						await azureUpload(uploadPath, path, {
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
						break;
					}
					case 's3': {
						server.tracker.set(path, {
							app,
							stream,
							filename,
							path,
							storage: 's3',
							date: now
						});

						server.metrics?.upload.attempt.inc({ storage: 's3' });

						await s3Upload(uploadPath, path, {
							onComplete: () => {
								count += 1;
								server.metrics?.upload.success.inc({ storage: 's3' });
								server.tracker.delete(path);
							},
							onFailure: () => {
								server.metrics?.upload.failure.inc({ storage: 's3' });
								server.tracker.delete(path);
							}
						});
						break;
					}
					default:
						server.log.error(`invalid storage type: ${server.config.storage.defaultStorage}`);
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

// TODO - Not used yet(?), need a to access the `dvr_path` setting from SRS
// This is able to handle an arbitrary dir depth, need to add a limit

// const walkRecordings = async function* (dir: string): AsyncGenerator<string> {
// 	const entries = await readdir(dir, { withFileTypes: true });

// 	for (const entry of entries) {
// 		const path = join(dir, entry.name);

// 		const viewable = await access(path, constants.R_OK)
// 			.then(() => true)
// 			.catch(() => false);

// 		if (!viewable) {
// 			server.log.warn(`skipping ${path}: no read access`);
// 			continue;
// 		}

// 		if (entry.isDirectory()) {
// 			yield* walkRecordings(path);
// 		} else if (path.endsWith('.flv') && !server.tracker.has(path)) {
// 			yield path;
// 		}
// 	}
// };
