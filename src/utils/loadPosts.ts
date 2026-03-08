import { marked } from 'marked';

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const data: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      data[key] = val;
    }
  }
  return { data, content: match[2] };
}

export function loadPosts() {
  const modules = import.meta.glob('../posts/*.md', { eager: true, query: '?raw', import: 'default' });

  const posts = Object.entries(modules).map(([path, raw]) => {
    const filename = path.split('/').pop()!;
    const slug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    const { data, content } = parseFrontmatter(raw as string);
    const html = marked(content);
    return {
      slug,
      filename,
      html,
      meta: {
        title: (data.title as string) || slug,
        date: data.date ? String(data.date).slice(0, 10) : null,
        excerpt: (data.excerpt as string) || '',
        tags: (data.tags as string[]) || []
      }
    };
  });

  posts.sort((a, b) => (b.meta.date || '').localeCompare(a.meta.date || ''));
  return posts;
}
