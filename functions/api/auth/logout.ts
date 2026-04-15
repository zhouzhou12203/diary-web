import type { ApiResponse } from '../../../src/types/index.ts';
import type { Env } from '../_shared.ts';
import { clearSessionCookie, jsonResponse, optionsResponse } from '../_shared.ts';

export const onRequestOptions = async (): Promise<Response> => optionsResponse();

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  return jsonResponse<ApiResponse>({
    success: true,
    message: '已退出登录',
  }, {
    headers: {
      'Set-Cookie': clearSessionCookie(context.env, context.request),
    },
  });
};
