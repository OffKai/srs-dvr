export type UploadFunc = (
	uploadPath: string,
	filePath: string,
	options?: {
		onComplete?: () => void | Promise<void>;
		onAbort?: () => void | Promise<void>;
	}
) => Promise<void>;

export type DvrWebhookPayload = {
	server_id: string;
	service_id: string;
	action: string;
	client_id: string;
	ip: string;
	vhost: string;
	app: string;
	tcUrl: string;
	stream: string;
	param: string;
	cwd: string;
	file: string;
	stream_url: string;
	stream_id: string;
};

export type StorageTypes = 'azure';

export type TrackerVideo = {
	app: string;
	stream: string;
	filename: string;
	path: string;
	storage: StorageTypes;
	date: string;
};
