UPDATE `orderassignment`
SET `status` = 'packed'
WHERE `status` = 'packaged';

UPDATE `order`
SET `fulfillmentStatus` = 'packed'
WHERE `fulfillmentStatus` = 'packaged';
