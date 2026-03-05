interface HtmlTemplateOptions {
  scriptUri: string;
  styleUri: string;
  logoUri: string;
  nonce: string;
  cspSource: string;
}

export function getHtmlTemplate(options: HtmlTemplateOptions): string {
  const { scriptUri, styleUri, logoUri, nonce, cspSource } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src ${cspSource} 'unsafe-inline';
    script-src 'nonce-${nonce}' ${cspSource} 'unsafe-eval';
    img-src ${cspSource} data: https:;
    font-src ${cspSource} data:;
    connect-src https: http:;
  ">
  <link rel="stylesheet" href="${styleUri}">
  <title>BlastShield Studio</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.__BLASTSHIELD_LOGO__ = "${logoUri}";
  </script>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
