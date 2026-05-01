// acquireMigrationLockLua
export const acquireMigrationLockLua = `
  local currentStatus = redis.call("GET", KEYS[2])
  
  -- Don't allow locking if already completed
  if currentStatus == ARGV[3] then 
    return -1 
  end

  if redis.call("EXISTS", KEYS[1]) == 0 then
    redis.call("SET", KEYS[1], ARGV[1], "EX", ARGV[2])
    redis.call("SET", KEYS[2], ARGV[4], "EX", ARGV[5])
    return 1
  end

  return 0
`;
