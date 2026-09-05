import { proxyAdmin } from '../proxy';

export const GET = (request: Request) => proxyAdmin(request, 'posts');
export const POST = (request: Request) => proxyAdmin(request, 'posts');
export const PUT = (request: Request) => proxyAdmin(request, 'posts');
export const DELETE = (request: Request) => proxyAdmin(request, 'posts');
export const PATCH = (request: Request) => proxyAdmin(request, 'posts');
