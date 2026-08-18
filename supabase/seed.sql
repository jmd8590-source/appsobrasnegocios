-- =====================================================
-- ScrapLens — Seed: Materials Catalog
-- Precios orientativos de mercado (Europa, 2024)
-- Actualizar según fuentes: LME, Recupera, Ferroatlántica
-- =====================================================

insert into public.materials_catalog
  (name, category, subtype, price_per_kg, color_hex, description)
values
  -- METALES NO FÉRREOS
  ('Cobre limpio', 'metal', 'cobre', 6.80, '#B87333', 'Cobre puro sin aleaciones, cables pelados, tuberías limpias'),
  ('Cobre mezcla', 'metal', 'cobre', 5.20, '#B87333', 'Cobre mezclado, cables con aislamiento, accesorios varios'),
  ('Aluminio perfiles', 'metal', 'aluminio', 1.40, '#A8A9AD', 'Perfiles de aluminio extruidos, marcos, estructuras'),
  ('Aluminio fundición', 'metal', 'aluminio', 1.10, '#A8A9AD', 'Piezas de fundición, tapas, cárteres'),
  ('Aluminio latas', 'metal', 'aluminio', 0.90, '#A8A9AD', 'Envases, chapa fina de aluminio'),
  ('Latón', 'metal', 'latón', 3.60, '#CFB53B', 'Latón en cualquier forma: grifería, accesorios, chatarra'),
  ('Bronce', 'metal', 'bronce', 4.10, '#CD7F32', 'Piezas de bronce, cojinetes, esculturas'),
  ('Plomo', 'metal', 'plomo', 1.65, '#708090', 'Plomo puro, baterías, contrapesos'),
  ('Zinc', 'metal', 'zinc', 2.30, '#9FA8A8', 'Chapa galvanizada, ánodos, componentes'),
  ('Estaño', 'metal', 'estaño', 18.50, '#D3D3D3', 'Soldaduras, recubrimientos, componentes electrónicos'),

  -- METALES FÉRREOS
  ('Acero estructural', 'metal', 'acero', 0.22, '#708090', 'Vigas, pilares, estructuras de acero al carbono'),
  ('Chapa de acero', 'metal', 'acero', 0.18, '#708090', 'Chapa fina y gruesa de acero laminado'),
  ('Acero inoxidable 304', 'metal', 'inox', 1.20, '#C0C0C0', 'Inox AISI 304, electrodomésticos, cocina'),
  ('Acero inoxidable 316', 'metal', 'inox', 1.45, '#C0C0C0', 'Inox AISI 316, aplicaciones marinas, químico'),
  ('Hierro fundido', 'metal', 'hierro', 0.14, '#4A4A4A', 'Radiadores, piezas de fundición gris'),
  ('Chatarra mixta hierro', 'metal', 'hierro', 0.10, '#4A4A4A', 'Hierro mezclado, ferralla, scrap general'),

  -- CABLES
  ('Cable eléctrico Cu ≥40%', 'metal', 'cables', 2.80, '#FF6B35', 'Cables con contenido de cobre ≥40%, sin quemar'),
  ('Cable eléctrico mezcla', 'metal', 'cables', 1.60, '#FF6B35', 'Cables mixtos, armados, con PVC grueso'),
  ('Cable aluminio', 'metal', 'cables', 0.95, '#A8A9AD', 'Cable de aluminio con aislamiento'),
  ('Cables electrónica', 'metal', 'cables', 0.85, '#FF6B35', 'Cables de datos, USB, HDMI, varios'),

  -- MADERA
  ('Madera de pino nueva', 'wood', 'pino', 0.08, '#DEB887', 'Listones y tablones de pino en buen estado'),
  ('Madera dura (roble/haya)', 'wood', 'dura', 0.15, '#8B4513', 'Madera dura en buenas condiciones'),
  ('Palés de madera', 'wood', 'palés', 2.50, '#D2B48C', 'Palés EUR/EPAL en buen estado (precio por unidad)'),
  ('Madera de derribo', 'wood', 'derribo', 0.04, '#A0785A', 'Madera usada de demolición, vigas, tablones'),

  -- TABLEROS
  ('Tablero DM/MDF', 'wood', 'tablero', 0.05, '#C4A882', 'Tablero de densidad media, recortes, piezas'),
  ('Tablero contrachapado', 'wood', 'tablero', 0.07, '#C4A882', 'Contrachapado en varias calidades'),
  ('Tablero aglomerado', 'wood', 'tablero', 0.03, '#C4A882', 'Aglomerado de baja densidad, muebles desguazados'),
  ('OSB', 'wood', 'tablero', 0.06, '#C4A882', 'Tablero de virutas orientadas, obra'),

  -- PLÁSTICOS
  ('PET botellas', 'plastic', 'pet', 0.28, '#87CEEB', 'Botellas PET transparentes prensadas'),
  ('HDPE recipientes', 'plastic', 'hdpe', 0.35, '#98FB98', 'Garrafas, bidones HDPE de color'),
  ('Polipropileno (PP)', 'plastic', 'pp', 0.22, '#DDA0DD', 'Tapones, cajas, componentes PP'),
  ('PVC rígido', 'plastic', 'pvc', 0.12, '#F0E68C', 'Tubería PVC, perfiles, láminas rígidas'),
  ('Plástico mezcla/ABS', 'plastic', 'mixto', 0.08, '#D3D3D3', 'Plástico mezclado, ABS, carcasas'),
  ('Poliestireno (EPS)', 'plastic', 'eps', 0.05, '#FFFACD', 'Corcho blanco, envases de espuma'),

  -- RESIDUOS DE OBRA
  ('Áridos limpios', 'construction', 'áridos', 0.015, '#C2B280', 'Grava, arena, hormigón triturado limpio'),
  ('Ladrillo y cerámica', 'construction', 'cerámica', 0.012, '#CD5C5C', 'Ladrillo roto, baldosas, cerámica de derribo'),
  ('Hormigón armado', 'construction', 'hormigón', 0.010, '#808080', 'Restos de hormigón con armadura de acero'),
  ('Yeso y escayola', 'construction', 'yeso', 0.008, '#FFFAF0', 'Restos de yeso, tabiques, revestimientos'),
  ('Residuo obra mixto', 'construction', 'mixto', 0.005, '#A9A9A9', 'RCD mixto sin separar, gestión especial')
on conflict do nothing;
