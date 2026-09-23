-- Servicio reservable y de catálogo: Cavitación 40k y Vacuum
-- INSERT ... WHERE NOT EXISTS: en producción puede no existir UNIQUE (categoria_id, nombre),
-- así que ON CONFLICT (categoria_id, nombre) fallaría con 42P10.

insert into public.servicios (
  categoria_id,
  categoria_label,
  nombre,
  precio,
  duracion_minutos,
  descripcion,
  activo,
  imagen_url,
  badges,
  sort_order
)
select
  'corporal',
  'Remodelación Corporal',
  'Cavitación 40k y Vacuum',
  0,
  60,
  'Ultrasonido de 40 kHz y succión vacuum para acompañar la reducción localizada y el drenaje, con un protocolo Amore preciso y respetuoso.',
  true,
  '/presoterapia.png',
  array['Reductor','Drenante']::text[],
  16
where not exists (
  select 1
  from public.servicios s
  where s.nombre = 'Cavitación 40k y Vacuum'
);
