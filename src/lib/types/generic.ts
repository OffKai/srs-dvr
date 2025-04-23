export type Unvalidated<T> = T extends object
	? {
			[P in keyof T]: T[P] extends object ? Unvalidated<T[P]> : unknown;
		}
	: T;

export type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
		}
	: T;
