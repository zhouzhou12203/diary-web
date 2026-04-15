import type { ApiResponse } from '../../../src/types/index.ts';
import type { Env } from '../_shared.ts';
import {
  buildSessionCookie,
  createSessionToken,
  getPublicSettings,
  jsonResponse,
  optionsResponse,
  parseJsonBody,
  verifyPasswordForScope,
} from '../_shared.ts';

type LoginScope = 'app' | 'admin';

type LoginRequest = {
  scope?: LoginScope;
  password?: string;
};

type SessionResponse = {
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
};

const LOGIN_BODY_MAX_BYTES = 16 * 1024;

function isValidScope(value: string | undefined): value is LoginScope {
  return value === 'app' || value === 'admin';
}

export const onRequestOptions = async (): Promise<Response> => optionsResponse();

export const onRequestPost = async (context: { request: Request; env: Env }): Promise<Response> => {
  try {
    const { data: body, error: bodyError, status: bodyStatus } = await parseJsonBody<LoginRequest>(context.request, {
      requireObject: true,
      requireJsonContentType: true,
      maxBodyBytes: LOGIN_BODY_MAX_BYTES,
    });
    if (!body) {
      return jsonResponse<ApiResponse>({
        success: false,
        error: bodyError ?? '请求体格式无效',
      }, { status: bodyStatus ?? 400 });
    }

    const scope = body.scope;

    if (!isValidScope(scope)) {
      return jsonResponse<ApiResponse>({
        success: false,
        error: '无效的登录类型',
      }, { status: 400 });
    }

    if (scope === 'app') {
      const publicSettings = await getPublicSettings(context.env.DB);
      const passwordProtectionEnabled = publicSettings.app_password_enabled === 'true';

      if (passwordProtectionEnabled) {
        const password = body.password?.trim() ?? '';
        const verified = password
          ? await verifyPasswordForScope(context.env.DB, 'app', password, context.env)
          : false;

        if (!verified) {
          return jsonResponse<ApiResponse>({
            success: false,
            error: '访问密码错误',
          }, { status: 401 });
        }
      }

      const token = await createSessionToken('app', context.env);
      return jsonResponse<SessionResponse>({
        success: true,
        data: {
          isAuthenticated: true,
          isAdminAuthenticated: false,
        },
      }, {
        headers: {
          'Set-Cookie': buildSessionCookie(token, context.env, context.request),
        },
      });
    }

    const password = body.password?.trim() ?? '';
    if (!password) {
      return jsonResponse<ApiResponse>({
        success: false,
        error: '请输入管理员密码',
      }, { status: 400 });
    }

    const verified = await verifyPasswordForScope(context.env.DB, 'admin', password, context.env);
    if (!verified) {
      return jsonResponse<ApiResponse>({
        success: false,
        error: '管理员密码错误',
      }, { status: 401 });
    }

    const token = await createSessionToken('admin', context.env);
    return jsonResponse<SessionResponse>({
      success: true,
      data: {
        isAuthenticated: true,
        isAdminAuthenticated: true,
      },
    }, {
      headers: {
        'Set-Cookie': buildSessionCookie(token, context.env, context.request),
      },
    });
  } catch (error) {
    return jsonResponse<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '登录失败',
    }, { status: 500 });
  }
};
