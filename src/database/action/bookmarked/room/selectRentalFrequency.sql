/*
 @name SelectRentalFrequency
 */
SELECT
  rental,
  COUNT(rental) AS frequency
FROM
  filter_bookmarked_room_meta_data
WHERE
  utari_user = :userId !
GROUP BY
  rental
ORDER BY
  rental;