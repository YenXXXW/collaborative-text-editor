CREATE TABLE IF NOT EXISTS PROGRAMS (
  id BIGSERIAL PRIMARY KEY,
  language varchar(256) NOT NULL,
  code TEXT NOT NULL,
  room_id bigint NOT NULL
);
