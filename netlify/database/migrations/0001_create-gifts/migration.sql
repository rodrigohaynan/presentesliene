CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_hint TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INTEGER NOT NULL UNIQUE,
  reserved_by_name TEXT,
  reserved_by_email TEXT,
  reserved_at TIMESTAMPTZ
);

INSERT INTO gifts (id, name, description, price_hint, icon, sort_order) VALUES
  ('bolsa', 'Bolsa Maria Milão', 'Bolsa grande, preta ou off-white, da marca Maria Milão. Pode ser encontrada no Mercado Livre e deve ter bastante espaço para itens pessoais e do bebê.', 'Maria Milão • Grande', 'shopping-bag', 1),
  ('mochila', 'Mochila mocinha', 'Para levar itens nas missões e, futuramente, as coisas do bebê. Cores: rosinha-claro, verde-claro, bege ou azul-bebê.', 'Cores claras', 'heart', 2),
  ('pantalona', 'Calça pantalona em tecido Duna', 'Modelo confortável para usar durante e depois da gravidez.', 'Tamanho M', 'sparkles', 3),
  ('vestidos', 'Vestidos longos e soltinhos', 'Modelos confortáveis para usar durante a gravidez e também depois.', 'Longos e soltinhos', 'sparkles', 4),
  ('jardineira', 'Macacão jardineira longo', 'Modelo longo em tecido Duna ou malha, confortável para acompanhar a gestação.', 'Duna ou malha', 'star', 5),
  ('sandalia-off', 'Sandália off-white', 'Sandália delicada na cor off-white, com salto baixinho.', 'Salto baixo', 'star', 6),
  ('aneis-quadrados', 'Anéis quadrados', 'Anéis com desenho quadrado para compor os acessórios da Liene.', 'Modelo quadrado', 'gem', 7),
  ('aneis-grandes', 'Anéis grandes', 'Modelos maiores e marcantes, do jeito que ela gosta.', 'Modelos grandes', 'gem', 8),
  ('conjunto-joias', 'Conjunto de acessórios', 'Conjunto de brinco com pulseira ou colar, em prata ou dourado.', 'Prata ou dourado', 'gem', 9),
  ('blush-vult', 'Blush Gold perolado da Vult', 'Blush Gold com acabamento perolado, da Vult Cosméticos.', 'Vult Cosméticos', 'flower', 10),
  ('tenis-vizzano', 'Tênis branco da Vizzano', 'Modelo branco e confortável da Vizzano, ideal para o dia a dia.', 'Vizzano • Branco', 'star', 11)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_hint = EXCLUDED.price_hint,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

CREATE INDEX IF NOT EXISTS gifts_available_order_idx
  ON gifts (sort_order)
  WHERE reserved_at IS NULL;
