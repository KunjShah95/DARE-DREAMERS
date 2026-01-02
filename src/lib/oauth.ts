export function getGithubOAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.REACT_APP_GITHUB_CLIENT_ID || '',
    scope: 'read:user user:email',
    redirect_uri: process.env.REACT_APP_GITHUB_REDIRECT || `${window.location.origin}/api/auth/github/callback`,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export function getGoogleOAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: process.env.REACT_APP_GOOGLE_REDIRECT || `${window.location.origin}/api/auth/google/callback`,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
