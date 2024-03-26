module.exports = {
    //Admin Login
    Invalid_username_or_password: 550,

    //User-registration
    User_already_exists: 600,
    Registration_failed: 601,
    Failed_updating_user: 603,
    User_not_Found: 604,


    //Public Address
    Invalid_public_address: 605,
    Public_address_is_required: 552,

    //Name
    Name_is_required: 606,
    Invalid_name: 607,
    Max_length_string: 608,
    Min_length_string: 903,

    //Phone Number
    Invalid_phone_number: 609,
    Min_length_phone: 610,
    Max_length_phone: 611,
    Phone_number_already_exists: 598,
    mobile_required: 634,

    //Email Address
    Email_is_required: 599,
    Invalid_email_address: 612,
    Email_already_exists: 613,

    //Address
    Invalid_address: 614,
    Max_length_address: 615,
    Min_length_address: 904,
    Invalid_address_label: 908,
    Allowed_limit_for_address_reached: 911,
    Address_required: 633,
    Invalid_addressId: 644,

    //District
    Invalid_district: 616,
    Max_length_district: 617,
    Min_length_district: 905,
    District_required: 632,

    //	Pincode
    Invalid_pincode: 618,
    Min_length_pin: 619,
    Max_length_pin: 620,
    Pin_required: 631,

    // Status
    No_status_parameter: 621,
    Invalid_status_parameter: 622,

    //State
    Invalid_state: 623,
    Invalid_locality: 625,
    Invalid_city: 626,
    Invalid_country: 627,
    Country_required: 628,
    State_required: 630,
    Locality_required: 635,
    City_required: 636,
    Label_required: 637,
    Primary_requied: 638,
    Primary_cannot_empty: 639,
    Invalid_data_primary: 640,
    //Product
    Invalid_product_id: 699,
    Product_not_found: 950,
    Product_out_of_stock: 951,
    //product Name
    Invalid_product_name: 700,
    Min_length_product_name: 701,
    Max_length_product_name: 702,

    //Description
    Invalid_product_description: 703,
    Max_length_product_description: 704,
    Min_length_product_description: 705,

    //ProductImage
    Error_while_uploading_image: 706,
    Product_image_file_not_found: 707,
    Upload_image_not_found: 708,
    Image_does_not_exist: 709,

    //Price
    Invalid_product_price: 710,
    Price_greater_than_original_price: 711,

    //originalPrice
    Invalid_product_original_price: 712,
    Original_price_less_than_price: 713,
    Invalid_original_price_parameter: 721,

    //availableStock
    Invalid_available_stock: 714,

    //coverImage
    Invalid_cover_image: 715,

    //specifications
    Invalid_product_specification: 716,

    //catgoryId
    Invalid_product_categoryId: 717,

    //subCategoryId
    Invalid_product_subCategoryId: 718,

    //brandId
    Invalid_product_brandId: 719,

    //typeId
    Invalid_product_typeId: 720,

    //productImage
    No_product_image_specified: 722,
    Invalid_product_image_type: 723,
    Atleast_one_image_needed: 724,
    Duplicate_images_not_allowed: 725,
    Should_not_contain_more_than_6_images: 726,

    //Signature
    Invalid_signature: 750,
    Error_obtaining_user_signature: 751,
    Signature_is_required: 752,
    Error_verifying_signature: 753,
    Signature_not_found: 754,
    Error_creating_user_signature: 755,

    Error_in_product_delete_status_change: 756,
    Product_already_in_given_deleted_status: 757,
    Product_not_available: 758,
    Deleted_parameter_not_provided: 759,
    Product_Id_not_provided: 760,
    Error_while_deleting_product: 761,


    //Refresh Token
    Invalid_refresh_token: 801,
    Invalid_access_token: 802,
    No_access_token_provided: 803,
    User_is_blocked: 804,


    // comments
    Comment_is_empty: 900,
    Invalid_comment: 901,
    Invalid_comment_length: 902,

    //Cart
    Invalid_quantity: 903,
    No_quantityEntered: 909,
    No_product_id_entered: 850,
    No_products_array_given: 851,
    Products_must_be_array: 852,
    Products_array_empty: 853,
    Element_must_be_object: 854,
    Object_must_contain_productId_and_productQuantity: 855,
    Failed_to_addCartItems: 904,
    Failed_to_updateCartItems: 905,
    Failed_to_deleteItems_from_cart: 906,
    Product_not_in_cart: 907,
    Failed_to_fetch_reward_coin_history: 908,
    Failed_to_fetch_cartItems: 910,

    //crud
    Failed_adding_order: 1000,
    Failed_updating_order: 1001,
    Failed_fetching_product: 1002,
    Failed_fetching_orders: 1003,
    Invalid_order_Id: 1004,
    Failed_adding_product: 1005,
    Failed_storing_tranasaction_hash: 1006,
    Error_fetching_user: 1007,
    Error_fetching_categories: 1008,
    Error_fetching_brands: 1009,
    Error_fetching_products: 1010,
    Error_fetching_product_history: 1011,


    //page
    Invalid_page_Number: 1050,
    Invalid_page_size: 1051,
    Invalid_gender_parameter: 1052,
    Invalid_views_parameter: 1053,
    Invalid_sales_parameter: 1054,
    Invalid_price_paramter: 1055,
    Invalid_orderstatus_parameter: 1056,
    Invalid_updateDate_parameter: 1057,
    Invalid_paymentstatus_parameter: 1058,
    Invalid_sort_parameter: 1059,
    Invalid_key_parameter: 1060,
    Invalid_parameter_delimiter: 1063,

    //wishlist
    Error_adding_product_to_wishlist: 2000,
    Error_deleting_product_from_wislist: 2001,
    Product_already_exists_in_wishlist: 2002,
    Failed_fetching_wishlist: 2003,



    //Feedback
    Error_while_adding_feedback: 3500,
    Error_while_deleting_feedback: 3501,
    Invalid_rating_type: 3502,
    No_rating_specified: 3503,
    User_does_not_own_item: 3504,
    Invalid_rating_parameter: 3505,
    Invalid_deleted_parameter: 3506,
    Feedback_not_found: 3507,
    Feedback_already_exists: 3508,
    Review_should_be_string: 3509,
    Review_cannot_empty: 3510,
    Review_title_should_be_string: 3511,
    Review_title_cannot_empty: 3512,
    Invalid_outOfStock_parameter: 3513,
    No_review_title_given: 3514,
    Error_while_editing_feedback: 3515,


    //counts
    Error_while_fetching_counts: 3600,
    Error_fetching_wishlist_counts: 3601,
    Error_fetching_cart_counts: 3602,


    //Order
    No_order_found: 4000,
    Invalid_OrderId: 4001,
    Failed_to_Cancel_Order: 4002,
    Order_already_cancelled: 4003,
    Invalid_Order_status: 4006,
    OrderId_not_Entered: 4007,

    //BuyNow
    Invalid_productId: 4004,
    ProductId_Required: 4005,
    discount_notFound: 4008,
    ProductQuantity_Required: 5001,
    totalEthereumPaid_notFound: 4009,
    total_NotFound: 4010,
    Invalid_discount: 4011,
    Invalid_total: 4012,
    Invalid_totalEthereumPaid: 4013,
    Invalid_deliveryAddress: 4014,
    Invalid_payment_transactionHash: 4015,
    Delivery_Address_not_entered: 4016,
    paymentTxHash_not_entered: 4017,

    Failed_to_placeorder: 4005,

    No_productIdEntered: 4006,
    No_discount_entered: 4007,
    No_paymentTransactionHashEntered: 5001,
    No_DeliveryAddressEntered: 5002,
    No_total_entered: 5003,
    No_productQuantityEntered: 5005,

    //Return
    Failed_to_Return_Items: 4018,
    Return_period_over: 4019,

    totalEthereumPaid_must_be_greater_than_zero: 4020,
    totalEthereumPaid_must_be_zero: 4021,
    Discount_cannot_be_greater_than_total: 4022,
    Product_price_stock_or_price_changed: 4023,
    Error_occured_during_stock_updation: 4024,
    Delivery_address_not_found: 4025,

    OrderId_not_found_for_user: 4026,



    //Notification
    Error_while_adding_notification: 1200,
    Error_while_fetching_notification: 1201,
    Error_while_updating_notification: 1202,
    Notification_id_is_empty: 1203,
    Invalid_notification_status: 1204,
    could_not_fetch_device_token: 1205,
    Notification_not_found: 1206,
    Device_token_required: 1207,
    Invalid_notification_id: 1208,
    Notification_status_not_found: 1209,


    //checkout
    Error_when_updating_stock: 952,
    //Address
    Address_exist_with_given_type: 1500,
    Address_not_found: 1501,

    User_id_required: 2513,
    //category
    Category_name_required: 2509,
    Invalid_category: 2514,
    Category_cannot_empty: 2515,
    Category_too_short: 2516,
    Category_too_long: 2517,
    Category_not_found: 2500,
    Category_exist: 2501,
    Dependancy_error_category: 2502,

    //subcategory
    Category_id_required: 2511,
    Subcategory_name_required: 2510,
    Subcategory_name_duplication: 2611,
    Invalid_subcategory: 2518,
    Subcategory_cannot_empty: 2519,
    Subcategory_too_short: 2520,
    Subcategory_too_long: 2521,
    Dependancy_error_subcategory: 2505,
    Subcategory_not_found: 2504,
    Subcategory_exist: 2503,
    Error_fetching_subcategories: 2608,

    //type
    Type_required: 2512,
    Invalid_type: 2522,
    Type_cannot_empty: 2523,
    Type_too_short: 2524,
    Type_too_long: 2525,
    Dependancy_error_type: 2508,
    Type_not_found: 2507,
    Type_exist: 2506,

    //Brand
    Brand_exist: 2600,
    Brand_not_found: 2601,
    Brand_required: 2602,
    Invalid_brand: 2603,
    Brand_cannot_empty: 2604,
    Brand_too_short: 2605,
    Brand_too_long: 2606,
    Dependancy_error_brand: 2607,

    //Field Length Validations
    Email_address_too_short: 3000,
    Email_address_too_long: 3001,
    Name_too_long: 3002,
    Name_too_short: 3003,
    Invalid_phone_length: 3004,
    Review_title_too_short: 3005,
    Review_title_too_long: 3006,
    Review_content_too_short: 3007,
    Review_content_too_long: 3008,
    Product_name_too_short: 3009,
    Product_name_too_long: 3010,
    Product_description_too_short: 3011,
    Product_description_too_long: 3012,
    Invalid_review_title_type: 3013,
    Invalid_review_type: 3014,



    Error_in_refund_process: 4500,
    Payment_in_pending_state: 4501,
    Order_cannot_be_cancelled: 4502,
    Could_not_update_feedback: 4503,
    Invalid_feedback_id: 4504,

    //Analytics
    Invalid_Year: 4506,
    Invalid_month: 4507,
    Invalid_day: 4508,
    Invalid_orderAnalytics: 4509,
    Invalid_userAnalytics: 4510,
    Failed_to_fetch_viewCount: 4511,
    Failed_to_fetch_saleCount: 4512,
    Failed_to_fetch_Statistics: 4513,
    Year_not_entered: 4514,


    //Status
    Failed_to_updateOrderStatus: 5000,
    Invalid_orderStatus: 5001,
    No_order_id_entered: 5002,
    No_order_status_entered: 5003,
    Order_should_be_in_returnInitiated_status: 5004,
    Order_should_be_in_outForDelivery_status: 5005,
    Order_already_in_delivered_status: 5006,

    Unexpected_error: 9999,

    //JSON ERRORS
    Invalid_body: 10000,

    //CheckoutConfimation

    Mismatch_in_price_or_stock: 5008,
    isFromCart_not_entered: 5009,
    Invalid_isFromCart_entered: 5010,
    isInCart_must_be_true: 5011,
    Error_file_fetching_image: 6000,

    //hash
    TransactionHash_mismatch: 6001,
    TransactionHash_incorrect: 6002,
    Error_fetching_transaction_info: 6003,

    //Chat
    Failed_to_addResponse: 6004,
    Failed_to_fetchResponse: 6005,
    Failed_to_addAdminResponse: 6006,
    Response_required: 6007,
    Response_cannot_Empty: 6008,
    Invalid_Response: 6009,
    Min_length_response: 7001,
    Max_length_response: 7002,
    Invalid_chatId: 7003,
    OrderId_cannotbe_Empty: 7004,
    Userid_cannot_Empty: 7005,
    No_product_found: 7006,
    Invalid_replyStatus: 7007,

    //Price_decimal_validation
    Original_price_value_exceeds_limit: 6010,
    Price_value_exceeds_limit: 6011,

    //calculateRefund
    Quantity_entered_higher_than_order_quantity: 6012,

    //status
    Access_restricted: 6014,

    //Home image
    HomeImage_not_found: 7008,
    Failed_to_addImage: 7009,
    Failed_to_fetchImage: 7010,
    Failed_to_editImage: 7025,
    Image_notFound: 7011,
    Invalid_Image_Type: 7012,
    HomeImage_Required: 7013,
    Should_not_contain_more_than_4_images: 7014,
    Image_type_Required: 7015,
    Image_type_cannotbe_empty: 7016,
    Invalid_ImageType: 7017,
    Min_length_Image: 7018,
    Max_length_Image: 7019,
    No_imageId_entered: 7020,
    ImageId_cannotbe_empty: 7021,
    Invalid_imageType: 7022,
    No_imageId_Found: 7023


}