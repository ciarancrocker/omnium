SELECT 
  A.game, 
  SUM(TIME_TO_SEC(TIMEDIFF(B.timestamp, A.timestamp))) AS time
FROM 
  GameLog A, 
  GameLog B 
WHERE 
  A.event = 'begin' 
  AND B.event = 'end' 
  AND A.user_id = B.user_id 
  AND A.game = B.game 
  AND B.id IN (
    SELECT 
      min(C.id) 
    FROM 
      GameLog C
    WHERE 
      C.id > A.id 
      AND A.user_id = C.user_id 
      AND A.game = C.game
  )
  AND A.game NOT IN (
    SELECT
      game
    FROM
      GameBlacklist
  )
GROUP BY A.game 
ORDER BY time DESC
LIMIT {{limit}};

