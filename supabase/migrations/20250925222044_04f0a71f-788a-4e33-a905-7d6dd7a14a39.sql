-- Add latitude and longitude fields to metododespacho table
ALTER TABLE public.metododespacho 
ADD COLUMN latitud DECIMAL(10, 8) NULL,
ADD COLUMN longitud DECIMAL(11, 8) NULL;