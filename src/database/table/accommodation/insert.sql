/*
 @name Insert
 @param params -> (
 id!,
 handler!,
 address!,
 latitude!,
 longitude!,
 remark!,
 month!,
 year!,
 region!,
 facilities!,
 accommodationType!,
 available!
 )
 */
INSERT INTO
  accommodation (
    id,
    handler,
    address,
    latitude,
    longitude,
    remark,
    month,
    year,
    region,
    facilities,
    accommodation_type,
    available
  )
VALUES
  :params RETURNING id;