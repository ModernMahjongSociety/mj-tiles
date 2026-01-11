/**
 * E2Eビジュアルテスト
 * 各アプリケーションの表示を確認します
 *
 * 実行前に `bun run dev` で全アプリケーションを起動してください
 */

const apps = [
  { name: 'astro-basic', url: 'http://localhost:4321' },
  { name: 'astro-mdx', url: 'http://localhost:4322' },
  { name: 'hono-jsx', url: 'http://localhost:3000' },
  { name: 'next-mdx', url: 'http://localhost:3001' },
  { name: 'react-vite', url: 'http://localhost:5173' },
  { name: 'vite-react-mdx', url: 'http://localhost:5174' },
];

console.log('E2Eビジュアルテスト開始');
console.log('chrome-devtools MCPを使用して各アプリケーションをテストします');
console.log('');

for (const app of apps) {
  console.log(`\n=== ${app.name} ===`);
  console.log(`URL: ${app.url}`);
  console.log('');
}

console.log('\n全アプリケーションのURLリスト:');
apps.forEach(app => {
  console.log(`- ${app.name}: ${app.url}`);
});
