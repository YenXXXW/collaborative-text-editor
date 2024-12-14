ALTER TABLE programs ADD CONSTRAINT fk_room FOREIGN KEY (room_id) REFERENCES rooms (id);
