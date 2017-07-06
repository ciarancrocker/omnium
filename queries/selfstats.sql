SELECT
  Games.name,
  SUM(TIME_TO_SEC(TIMEDIFF(B.timestamp, A.timestamp))) AS time
FROM
  GameLog A,
  GameLog B,
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
      GameLog C
    WHERE
      C.id > A.id
      AND A.user_id = C.user_id
      AND A.game_id = C.game_id
  )
  AND A.game_id = Games.id
  AND Games.display = 1
  AND A.user_id = {{user_id}}
GROUP BY A.game_id
ORDER BY time DESC
LIMIT {{limit}};

