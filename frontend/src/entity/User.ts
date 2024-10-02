/**
 * User information
 */
export interface User {
	readonly id: number;
	readonly username: string;
	readonly email?: string;
}

/**
 * A complete user
 */
export type FullUser = Required<User>;
