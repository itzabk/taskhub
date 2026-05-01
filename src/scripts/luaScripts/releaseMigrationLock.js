// releaseMigrationLockLua
export const releaseMigrationLockLua = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    -- Set the final status (COMPLETED or FAILED)
    redis.call("SET", KEYS[2], ARGV[2], "EX", ARGV[3])
    -- Delete the lock
    return redis.call("DEL", KEYS[1])
  end
  return 0
`;
