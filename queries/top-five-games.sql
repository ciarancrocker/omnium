SELECT 
  A.game, 
  SUM(B.timestamp - A.timestamp) AS time 
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
GROUP BY A.game 
ORDER BY time DESC
LIMIT 5;

