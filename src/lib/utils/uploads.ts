import { azureUpload } from '../../storage/azure/upload.js';
import { fmtUploadPath, tracker } from './fs.js';

// TODO - SRS doesn't implement webhook retries
// Considerations:
// - DVR is down at stream start
// - Tracker file is empty on restart and stream is over

export async function restartUploads(): Promise<void> {
	const videos = await tracker.read();

	for (const video of videos) {
		if (video.storage === 'azure') {
			const uploadPath = fmtUploadPath({
				app: video.app,
				stream: video.stream,
				filename: video.filename
			});

			void azureUpload(uploadPath, video.path, {
				onComplete: async () => {
					await tracker.remove(video.path);
				}
			});
		}
	}
}
