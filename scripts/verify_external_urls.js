const fs = require('fs');

const pages = [
  'site/pages/characters/sheng.html',
  'site/pages/characters/dan.html',
  'site/pages/characters/jing.html',
  'site/pages/genres/jingju.html',
  'site/pages/genres/yuju.html',
  'site/pages/genres/yueju.html',
  'site/pages/genres/huangmei.html',
];

const urls = pages.flatMap((file) =>
  [...fs.readFileSync(file, 'utf8').matchAll(/<a class="btn btn-ghost" href="([^"]+)"/g)]
    .map((match) => match[1].replaceAll('&amp;', '&'))
    .filter((url) => url.startsWith('https://')),
);

async function probe(url) {
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': 'Mozilla/5.0' },
    });
    return { url, status: response.status };
  } catch (error) {
    return { url, status: 'NETWORK_BLOCKED', error: error.cause?.code || error.name };
  }
}

Promise.all(urls.map(probe)).then((rows) => {
  console.log(JSON.stringify({
    count: rows.length,
    responded: rows.filter((item) => typeof item.status === 'number').length,
    rows,
  }, null, 2));
  if (rows.length !== 28) process.exitCode = 1;
});
