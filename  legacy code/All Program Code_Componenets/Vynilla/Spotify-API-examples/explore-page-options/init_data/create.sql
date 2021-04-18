DROP TABLE IF EXISTS friends CASCADE;

CREATE TABLE IF NOT EXISTS friends (
    friend_name VARCHAR(30),
    their_queue VARCHAR(100),
    PRIMARY KEY(friend_name)
);

INSERT INTO TABLE friends(friend_name, their_queue)
VALUES
("Jake", "Doesn't have one"),
("Dalbir", "00101010101"),
("Bernardo", "hey xD")
;
