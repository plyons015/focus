import { useState } from 'react';
import { copy } from '../domain/copy';
import { articles } from './articles';

export function HelpScreen({ onBack }: { onBack: () => void }) {
  const [id, setId] = useState(articles[0]?.id ?? 'get-started');
  const article = articles.find((item) => item.id === id) ?? articles[0];

  return (
    <section className="help">
      <button type="button" className="ghost" onClick={onBack}>
        {copy.back}
      </button>
      <h2>{copy.help}</h2>
      <p>{copy.helpIntro}</p>
      <div className="row">
        {articles.map((item) => (
          <button
            key={item.id}
            type="button"
            className="chip"
            aria-pressed={item.id === article?.id}
            onClick={() => setId(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>
      {article ? (
        <article className="card">
          <h2>{article.title}</h2>
          {article.blocks.map((block, index) => {
            if (block.type === 'h') return <h3 key={index}>{block.text}</h3>;
            if (block.type === 'li') {
              return (
                <ul key={index}>
                  {(block.items ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }
            return <p key={index}>{block.text}</p>;
          })}
        </article>
      ) : null}
    </section>
  );
}
