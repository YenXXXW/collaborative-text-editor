CREATE TABLE IF NOT EXISTS rooms(
  id BIGSERIAL PRIMARY KEY,
  users_in_room TEXT[] NOT NULL,
  creator_id BIGINT NOT NULL,
  created_at timestamp(0) with time zone NOT NULL DEFAULT NOW()
);
