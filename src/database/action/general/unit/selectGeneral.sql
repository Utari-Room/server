/*
 @name SelectGeneralUnitQuery
 @param bedRooms -> (...)
 @param bathRooms -> (...)
 */
SELECT
  "unitId",
  score,
  address,
  latitude,
  longitude,
  facilities,
  year,
  month,
  "bedRooms",
  "bathRooms",
  rental,
  ratings,
  "utariUser"
FROM
  (
    (
      (
        (
          SELECT
            id AS accommodation_id,
            address,
            latitude,
            longitude,
            month,
            year,
            region,
            facilities,
            accommodation_type
          FROM
            accommodation
          WHERE
            available = TRUE
            AND region = :region !
            AND (
              :search :: TEXT IS NULL
              OR (
                strict_word_similarity(:search, address) >= 0.1
                OR strict_word_similarity(:search, remark) >= 0.1
                OR strict_word_similarity(:search, facilities) >= 0.1
              )
            )
        ) accommodation
        JOIN (
          SELECT
            id AS "unitId",
            accommodation,
            bath_rooms AS "bathRooms",
            bed_rooms AS "bedRooms",
            rental,
            unit_type,
            score
          FROM
            unit
          WHERE
            available = TRUE
            AND (
              :minRental :: NUMERIC(10, 2) IS NULL
              OR rental >= :minRental
            )
            AND (
              :maxRental :: NUMERIC(10, 2) IS NULL
              OR rental <= :maxRental
            )
            AND bed_rooms IN :bedRooms
            AND bath_rooms IN :bathRooms
            AND unit_type = :unitType !
        ) unit ON accommodation.accommodation_id = unit.accommodation
      )
      LEFT OUTER JOIN (
        SELECT
          unit,
          utari_user AS "utariUser"
        FROM
          unit_bookmarked
        WHERE
          (
            :userId :: TEXT IS NULL
            OR utari_user = :userId
          )
      ) unit_bookmarked ON unit_bookmarked.unit = unit."unitId"
    )
    LEFT OUTER JOIN (
      SELECT
        unit,
        ARRAY_AGG(
          rating
          ORDER BY
            rating ASC
        ) ratings
      FROM
        (
          SELECT
            DISTINCT ON (unit, utari_user) unit,
            rating
          FROM
            unit_rating
          GROUP BY
            unit,
            utari_user,
            id
          ORDER BY
            unit,
            utari_user,
            id DESC
        ) latest_ratings
      GROUP BY
        unit
    ) unit_ratings ON unit."unitId" = unit_ratings.unit
  )
ORDER BY
  unit.score DESC
LIMIT
  :maxItemsPerPage ! OFFSET (:currentPage ! - 1) * :maxItemsPerPage !;