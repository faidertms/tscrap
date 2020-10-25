CREATE TABLE public.prices (
    product_id BIGINT NOT NULL,
    price numeric NOT NULL,
    created_at date NOT NULL,
    updated_at timestamp NOT NULL
);
ALTER TABLE ONLY public.prices
ADD CONSTRAINT product_unique UNIQUE (product_id, created_at);