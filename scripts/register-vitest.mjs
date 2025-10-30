import { register } from 'node:module';

register(new URL('./vitest-loader.mjs', import.meta.url));
