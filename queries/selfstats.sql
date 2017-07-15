SELECT
  games.name,
  SUM(EXTRACT(EPOCH FROM (B.timestamp - A.timestamp))) AS time
FROM
  game_log A,
  game_log B,
  Games
WHERE
  A.event = 'begin'
  AND B.event = 'end'
  AND A.user_id = B.user_id
  AND A.game_id = B.game_id
  AND B.id = (
    SELECT
    MIN(C.id)
    FROM
    game_log C
    WHERE
    C.id > A.id
    AND A.user_id = C.user_id
    AND A.game_id = C.game_id
  )
  AND A.game_id = Games.id
  AND games.display = TRUE
  AND A.user_id = {{user_id}}
GROUP BY games.name
ORDER BY time DESC
LIMIT {{limit}};

