export const PREDICTOR_REAL_SNAPSHOT = {
    "predictions_all":  {
                            "predictions":  [
                                                {
                                                    "cluster_id":  "cluster_1",
                                                    "crop":  "Tomatoes",
                                                    "timestamp":  "2026-03-29T11:02:06.137370Z",
                                                    "predicted_vwc_tomorrow":  10.82,
                                                    "current_vwc":  15.27,
                                                    "time_to_critical_days":  0.0,
                                                    "critical_threshold":  25.0,
                                                    "confidence":  0.2,
                                                    "irrigation_recommended":  true,
                                                    "top_drivers":  {
                                                                        "current_vwc":  15.2679,
                                                                        "delta_vwc_per_day":  -4.4483
                                                                    },
                                                    "model_version":  "cluster_1_vwc_tomorrow_cluster_1_vwc_tomorrow_2026-03-28",
                                                    "fallback_used":  false
                                                },
                                                {
                                                    "cluster_id":  "cluster_2",
                                                    "crop":  "Lettuce",
                                                    "timestamp":  "2026-03-29T11:02:06.137665Z",
                                                    "predicted_vwc_tomorrow":  1.17,
                                                    "current_vwc":  1.19,
                                                    "time_to_critical_days":  0.0,
                                                    "critical_threshold":  30.0,
                                                    "confidence":  0.2,
                                                    "irrigation_recommended":  true,
                                                    "top_drivers":  {
                                                                        "current_vwc":  1.1875,
                                                                        "delta_vwc_per_day":  -0.0202
                                                                    },
                                                    "model_version":  "cluster_2_vwc_tomorrow_cluster_2_vwc_tomorrow_2026-03-28",
                                                    "fallback_used":  false
                                                },
                                                {
                                                    "cluster_id":  "cluster_3",
                                                    "crop":  "Corn",
                                                    "timestamp":  "2026-03-29T11:02:06.137876Z",
                                                    "predicted_vwc_tomorrow":  0.0,
                                                    "current_vwc":  0.0,
                                                    "time_to_critical_days":  0.0,
                                                    "critical_threshold":  20.0,
                                                    "confidence":  0.2,
                                                    "irrigation_recommended":  true,
                                                    "top_drivers":  {
                                                                        "current_vwc":  0.0,
                                                                        "delta_vwc_per_day":  -0.0052
                                                                    },
                                                    "model_version":  "cluster_3_vwc_tomorrow_cluster_3_vwc_tomorrow_2026-03-28",
                                                    "fallback_used":  false
                                                }
                                            ],
                            "fetched_at":  "2026-03-29T11:02:06.137891Z"
                        },
    "sensors_latest":  {
                           "value":  [
                                         {
                                             "cluster_id":  "cluster_1",
                                             "nodes":  [
                                                           {
                                                               "id":  "3bea99cf-5403-4a24-b631-12f79ec4f8eb",
                                                               "timestamp":  "2026-03-27T18:02:00Z",
                                                               "cluster_id":  "cluster_1",
                                                               "node_id":  "node_1",
                                                               "base_station_id":  "base_1",
                                                               "vwc":  15.2679,
                                                               "rh":  83.6243,
                                                               "t_air":  23.7971,
                                                               "rain_flag":  false
                                                           }
                                                       ],
                                             "last_updated":  "2026-03-27T18:02:00Z"
                                         },
                                         {
                                             "cluster_id":  "cluster_2",
                                             "nodes":  [
                                                           {
                                                               "id":  "c2edc889-958c-496f-aaea-da0e70c98dc2",
                                                               "timestamp":  "2026-03-27T18:02:00Z",
                                                               "cluster_id":  "cluster_2",
                                                               "node_id":  "node_1",
                                                               "base_station_id":  "base_1",
                                                               "vwc":  1.1875,
                                                               "rh":  94.0707,
                                                               "t_air":  21.0862,
                                                               "rain_flag":  true
                                                           }
                                                       ],
                                             "last_updated":  "2026-03-27T18:02:00Z"
                                         },
                                         {
                                             "cluster_id":  "cluster_3",
                                             "nodes":  [
                                                           {
                                                               "id":  "a1ea7d82-8032-4a30-b6cf-6860b3a37ece",
                                                               "timestamp":  "2026-03-27T18:05:00Z",
                                                               "cluster_id":  "cluster_3",
                                                               "node_id":  "node_1",
                                                               "base_station_id":  "base_1",
                                                               "vwc":  0.0,
                                                               "rh":  40.6387,
                                                               "t_air":  21.4337,
                                                               "rain_flag":  true
                                                           }
                                                       ],
                                             "last_updated":  "2026-03-27T18:05:00Z"
                                         }
                                     ],
                           "Count":  3
                       },
    "history_by_cluster":  {
                               "cluster_1":  {
                                                 "value":  [
                                                               {
                                                                   "id":  "49ca7a30-90a1-4531-8f7f-6b75f4e8cb68",
                                                                   "timestamp":  "2026-03-22T12:03:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  56.4403,
                                                                   "rh":  85.1865,
                                                                   "t_air":  22.5254,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "0470ce37-c818-48eb-bfba-678e337a76d9",
                                                                   "timestamp":  "2026-03-22T18:00:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  56.3699,
                                                                   "rh":  85.5507,
                                                                   "t_air":  22.735,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "cd1f70d2-dd31-40fb-a958-2dc66fdce9f1",
                                                                   "timestamp":  "2026-03-23T00:04:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  41.8423,
                                                                   "rh":  84.3967,
                                                                   "t_air":  23.5179,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "e27ad5ad-5636-4632-9669-19b3bbe04944",
                                                                   "timestamp":  "2026-03-23T06:04:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  41.8559,
                                                                   "rh":  84.5164,
                                                                   "t_air":  23.3826,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "0ea969df-eb06-4389-88c2-720ad162e59e",
                                                                   "timestamp":  "2026-03-23T12:01:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  42.5812,
                                                                   "rh":  83.6952,
                                                                   "t_air":  23.3518,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "4ab4a8ff-a384-4c82-861b-3f8ee87ffdbc",
                                                                   "timestamp":  "2026-03-23T18:01:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  42.8331,
                                                                   "rh":  83.5279,
                                                                   "t_air":  23.6645,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "02c67764-1fb2-4816-bde5-42833fec9f98",
                                                                   "timestamp":  "2026-03-24T00:00:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  32.7898,
                                                                   "rh":  78.5625,
                                                                   "t_air":  24.1214,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "f4ec09f8-c2ac-4650-97de-b7be57009491",
                                                                   "timestamp":  "2026-03-24T06:01:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  32.7191,
                                                                   "rh":  78.5326,
                                                                   "t_air":  24.2717,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "4946c471-8986-4d9f-974b-ba6561510ab7",
                                                                   "timestamp":  "2026-03-24T12:01:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  32.8687,
                                                                   "rh":  80.0635,
                                                                   "t_air":  24.5599,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "1ef809f5-e497-47eb-9277-57d72f9988a4",
                                                                   "timestamp":  "2026-03-24T18:03:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  32.5815,
                                                                   "rh":  79.5713,
                                                                   "t_air":  24.4687,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "f9e413d9-0519-4a0b-bd94-7dcebb57f832",
                                                                   "timestamp":  "2026-03-25T00:03:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  25.8132,
                                                                   "rh":  83.6418,
                                                                   "t_air":  23.2676,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "1bc1477e-5931-4056-a1b7-fdfe3d5e907f",
                                                                   "timestamp":  "2026-03-25T06:05:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  25.8268,
                                                                   "rh":  82.1796,
                                                                   "t_air":  23.82,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "09c21a99-37ae-44c4-983f-76a04d234873",
                                                                   "timestamp":  "2026-03-25T12:00:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  26.1962,
                                                                   "rh":  83.3474,
                                                                   "t_air":  23.4973,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "24ee9e3e-c2a5-44b0-99ac-086070ee1f97",
                                                                   "timestamp":  "2026-03-25T18:00:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  25.8027,
                                                                   "rh":  83.5346,
                                                                   "t_air":  23.2857,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "b32884e9-9c6e-4d57-8dfe-611d011cbf97",
                                                                   "timestamp":  "2026-03-26T00:00:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  19.7838,
                                                                   "rh":  79.4011,
                                                                   "t_air":  23.7976,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "20252547-8529-462b-a497-c8fe342087e9",
                                                                   "timestamp":  "2026-03-26T06:04:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  19.9693,
                                                                   "rh":  80.6012,
                                                                   "t_air":  23.917,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "feeb5e84-0315-41d5-8c01-954372bba743",
                                                                   "timestamp":  "2026-03-26T12:04:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  19.9082,
                                                                   "rh":  80.3173,
                                                                   "t_air":  24.0851,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "54a2d2a5-625c-4024-a7e3-05533f959762",
                                                                   "timestamp":  "2026-03-26T18:00:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  20.0648,
                                                                   "rh":  79.2994,
                                                                   "t_air":  24.1147,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "f6b900de-e286-44e6-81ee-9c29339e26f9",
                                                                   "timestamp":  "2026-03-27T00:04:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  15.1627,
                                                                   "rh":  82.2089,
                                                                   "t_air":  23.7834,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "add6d14f-9bf7-426b-a0b7-68bb64b2cee0",
                                                                   "timestamp":  "2026-03-27T06:01:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  15.0239,
                                                                   "rh":  84.0461,
                                                                   "t_air":  23.7517,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "8d66a42f-0527-4c3f-a2da-6a569e187e32",
                                                                   "timestamp":  "2026-03-27T12:05:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  14.8799,
                                                                   "rh":  82.8441,
                                                                   "t_air":  23.9116,
                                                                   "rain_flag":  false
                                                               },
                                                               {
                                                                   "id":  "3bea99cf-5403-4a24-b631-12f79ec4f8eb",
                                                                   "timestamp":  "2026-03-27T18:02:00Z",
                                                                   "cluster_id":  "cluster_1",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  15.2679,
                                                                   "rh":  83.6243,
                                                                   "t_air":  23.7971,
                                                                   "rain_flag":  false
                                                               }
                                                           ],
                                                 "Count":  22
                                             },
                               "cluster_2":  {
                                                 "value":  [
                                                               {
                                                                   "id":  "6402c877-8b6d-4c7f-86f6-7c2abeb2725c",
                                                                   "timestamp":  "2026-03-22T12:02:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.4236,
                                                                   "rh":  67.8993,
                                                                   "t_air":  19.3298,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "800cd73d-1bba-4248-b7de-d745f71ecb00",
                                                                   "timestamp":  "2026-03-22T18:05:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.4096,
                                                                   "rh":  67.5765,
                                                                   "t_air":  19.8406,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "7917ee1a-06f1-42ea-a838-37b428c5422d",
                                                                   "timestamp":  "2026-03-23T00:00:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.3688,
                                                                   "rh":  83.1675,
                                                                   "t_air":  15.9556,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "e7501542-cc64-4db3-ae2f-97567da06f9e",
                                                                   "timestamp":  "2026-03-23T06:02:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.3515,
                                                                   "rh":  82.0662,
                                                                   "t_air":  16.4649,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "20483670-cf7c-4772-a9ad-be3eba374e85",
                                                                   "timestamp":  "2026-03-23T12:02:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.3699,
                                                                   "rh":  84.0121,
                                                                   "t_air":  16.0297,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "8e9a2ed8-65c7-4687-a66b-3a9d4f2b7f03",
                                                                   "timestamp":  "2026-03-23T18:01:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.3518,
                                                                   "rh":  83.7277,
                                                                   "t_air":  16.0736,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "aa703b4e-af58-4fe2-b7a3-e159f3fcdd0b",
                                                                   "timestamp":  "2026-03-24T00:03:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.2842,
                                                                   "rh":  44.5511,
                                                                   "t_air":  22.9387,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "d907eb30-15c5-42be-a2b3-b5fe19076603",
                                                                   "timestamp":  "2026-03-24T06:03:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.2782,
                                                                   "rh":  44.6388,
                                                                   "t_air":  22.5163,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "a8ade996-a483-4cd9-b04b-fc1cb4c7ddc8",
                                                                   "timestamp":  "2026-03-24T12:00:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.2622,
                                                                   "rh":  43.8954,
                                                                   "t_air":  22.6102,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "093983e7-cb4a-4431-8bba-b1f7dff4e1dc",
                                                                   "timestamp":  "2026-03-24T18:00:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.2635,
                                                                   "rh":  45.2872,
                                                                   "t_air":  22.5372,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "0a7f0937-4b61-4cbd-850b-d19765b7d5d0",
                                                                   "timestamp":  "2026-03-25T00:00:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.2436,
                                                                   "rh":  53.2709,
                                                                   "t_air":  20.8367,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "e3a78ca0-dc51-465d-997a-3d44d320491e",
                                                                   "timestamp":  "2026-03-25T06:02:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.2276,
                                                                   "rh":  51.3894,
                                                                   "t_air":  21.2009,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "1c2ed1be-4d58-4419-a631-5e51ccdc90b8",
                                                                   "timestamp":  "2026-03-25T12:01:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.2312,
                                                                   "rh":  52.4129,
                                                                   "t_air":  20.8731,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "b2ac0606-afaa-40a1-b589-8e3154fdb08d",
                                                                   "timestamp":  "2026-03-25T18:04:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.2353,
                                                                   "rh":  52.1294,
                                                                   "t_air":  20.69,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "bd1c0eed-ae12-4928-95c0-7b0b611d6472",
                                                                   "timestamp":  "2026-03-26T00:04:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.2084,
                                                                   "rh":  83.9765,
                                                                   "t_air":  21.5001,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "306a1491-f5ca-4d8c-8dff-7bac8e1ab8ee",
                                                                   "timestamp":  "2026-03-26T06:04:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.1975,
                                                                   "rh":  85.4566,
                                                                   "t_air":  21.274,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "abfc9480-409f-4749-a966-1d7465998c89",
                                                                   "timestamp":  "2026-03-26T12:00:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.2087,
                                                                   "rh":  83.813,
                                                                   "t_air":  21.5397,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "3809e8df-fb72-4d86-a23f-8cf3075eceab",
                                                                   "timestamp":  "2026-03-26T18:04:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.2178,
                                                                   "rh":  84.6282,
                                                                   "t_air":  21.1243,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "35f6b180-0b59-4cd7-b224-351f9d08e180",
                                                                   "timestamp":  "2026-03-27T00:04:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.1893,
                                                                   "rh":  93.8093,
                                                                   "t_air":  21.2995,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "ae408a9b-a790-4093-9a2d-33868a05ba6b",
                                                                   "timestamp":  "2026-03-27T06:00:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.1722,
                                                                   "rh":  93.9337,
                                                                   "t_air":  21.2611,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "a37f5bae-1035-4a75-a207-07706f49571b",
                                                                   "timestamp":  "2026-03-27T12:00:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.1999,
                                                                   "rh":  93.0776,
                                                                   "t_air":  21.4967,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "c2edc889-958c-496f-aaea-da0e70c98dc2",
                                                                   "timestamp":  "2026-03-27T18:02:00Z",
                                                                   "cluster_id":  "cluster_2",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  1.1875,
                                                                   "rh":  94.0707,
                                                                   "t_air":  21.0862,
                                                                   "rain_flag":  true
                                                               }
                                                           ],
                                                 "Count":  22
                                             },
                               "cluster_3":  {
                                                 "value":  [
                                                               {
                                                                   "id":  "03a13c4b-0529-47ee-9706-ef25b70fb56e",
                                                                   "timestamp":  "2026-03-22T12:05:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0225,
                                                                   "rh":  30.6785,
                                                                   "t_air":  25.8347,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "c96a0019-d4d3-4213-b4a7-bcccfc48dc74",
                                                                   "timestamp":  "2026-03-22T18:00:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0227,
                                                                   "rh":  32.0399,
                                                                   "t_air":  25.9534,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "273305ee-762a-40b0-867f-fd06538aee24",
                                                                   "timestamp":  "2026-03-23T00:04:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0212,
                                                                   "rh":  29.7208,
                                                                   "t_air":  25.5067,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "14db43ef-f4de-43bb-9656-42ae648889f6",
                                                                   "timestamp":  "2026-03-23T06:03:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0208,
                                                                   "rh":  31.352,
                                                                   "t_air":  25.6884,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "99a143d8-372f-4005-8f45-0bd55e7ad5e5",
                                                                   "timestamp":  "2026-03-23T12:05:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.021,
                                                                   "rh":  31.2082,
                                                                   "t_air":  25.2627,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "805fd7c6-31a4-4025-bb8b-1705fa3375c4",
                                                                   "timestamp":  "2026-03-23T18:04:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0209,
                                                                   "rh":  31.963,
                                                                   "t_air":  25.484,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "238b9eab-52bf-4354-8734-b6eb65db7afb",
                                                                   "timestamp":  "2026-03-24T00:02:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0181,
                                                                   "rh":  35.0931,
                                                                   "t_air":  24.5066,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "ae683a0c-0def-4e14-b22e-0162a587e5b3",
                                                                   "timestamp":  "2026-03-24T06:02:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0181,
                                                                   "rh":  33.7174,
                                                                   "t_air":  24.0538,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "9bc7cf5e-c62e-440b-9bba-9945cd998e78",
                                                                   "timestamp":  "2026-03-24T12:05:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0178,
                                                                   "rh":  33.8881,
                                                                   "t_air":  24.2094,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "6ddc8199-6ff7-4be2-bab6-e0eee7523096",
                                                                   "timestamp":  "2026-03-24T18:05:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0179,
                                                                   "rh":  34.5051,
                                                                   "t_air":  24.5234,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "ad70d6d4-f6cb-4c05-a6f1-7963cae2489c",
                                                                   "timestamp":  "2026-03-25T00:05:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0053,
                                                                   "rh":  36.6855,
                                                                   "t_air":  24.8829,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "3f187b88-5a35-4e57-87f7-d3d6bbb52022",
                                                                   "timestamp":  "2026-03-25T06:04:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0053,
                                                                   "rh":  37.0424,
                                                                   "t_air":  24.7487,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "22181298-a722-4f1c-8fff-f043f3ecec98",
                                                                   "timestamp":  "2026-03-25T12:02:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0053,
                                                                   "rh":  35.1975,
                                                                   "t_air":  24.9589,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "1ef9d315-63cd-4401-862d-6fb58a461122",
                                                                   "timestamp":  "2026-03-25T18:05:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0052,
                                                                   "rh":  34.9974,
                                                                   "t_air":  25.1185,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "49fbb73f-6170-4ab8-a814-0f71f974def4",
                                                                   "timestamp":  "2026-03-26T00:03:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0057,
                                                                   "rh":  32.4644,
                                                                   "t_air":  25.3895,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "4c37b75f-c6e4-46a8-a068-903e942e7598",
                                                                   "timestamp":  "2026-03-26T06:05:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0057,
                                                                   "rh":  33.5205,
                                                                   "t_air":  25.5139,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "0a854172-029d-443d-8aeb-e67650fcc8a0",
                                                                   "timestamp":  "2026-03-26T12:03:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0057,
                                                                   "rh":  31.7658,
                                                                   "t_air":  25.1612,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "454a3593-1086-4626-9749-9b12792e52aa",
                                                                   "timestamp":  "2026-03-26T18:05:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0057,
                                                                   "rh":  33.5723,
                                                                   "t_air":  25.2156,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "3bbf32ff-323d-4297-b141-b8f32bfeba53",
                                                                   "timestamp":  "2026-03-27T00:01:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0,
                                                                   "rh":  38.7908,
                                                                   "t_air":  21.1528,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "a0b0f2f6-b004-4e16-ad5d-4756219fc166",
                                                                   "timestamp":  "2026-03-27T06:01:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0,
                                                                   "rh":  39.0394,
                                                                   "t_air":  21.0418,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "f36a7536-4b98-4b3a-8832-b7d5740a339c",
                                                                   "timestamp":  "2026-03-27T12:02:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0,
                                                                   "rh":  38.6314,
                                                                   "t_air":  21.158,
                                                                   "rain_flag":  true
                                                               },
                                                               {
                                                                   "id":  "a1ea7d82-8032-4a30-b6cf-6860b3a37ece",
                                                                   "timestamp":  "2026-03-27T18:05:00Z",
                                                                   "cluster_id":  "cluster_3",
                                                                   "node_id":  "node_1",
                                                                   "base_station_id":  "base_1",
                                                                   "vwc":  0.0,
                                                                   "rh":  40.6387,
                                                                   "t_air":  21.4337,
                                                                   "rain_flag":  true
                                                               }
                                                           ],
                                                 "Count":  22
                                             }
                           },
    "chart_by_cluster":  {
    "cluster_1": {
        "cluster_id": "cluster_1",
        "model_version": "cluster_1_vwc_tomorrow_cluster_1_vwc_tomorrow_2026-03-28",
        "split_ratio": 0.8,
        "split_index": 52,
        "split_timestamp": "2026-03-13T12:00:00Z",
        "total_rows": 66,
        "fallback_used": true,
        "train_history": [
            {
                "timestamp": "2026-01-20T12:00:00Z",
                "actual_vwc": 89.58
            },
            {
                "timestamp": "2026-01-21T12:00:00Z",
                "actual_vwc": 84.69
            },
            {
                "timestamp": "2026-01-22T12:00:00Z",
                "actual_vwc": 83.85
            },
            {
                "timestamp": "2026-01-23T12:00:00Z",
                "actual_vwc": 93.01
            },
            {
                "timestamp": "2026-01-24T12:00:00Z",
                "actual_vwc": 93.95
            },
            {
                "timestamp": "2026-01-25T12:00:00Z",
                "actual_vwc": 89.4
            },
            {
                "timestamp": "2026-01-26T12:00:00Z",
                "actual_vwc": 89.4
            },
            {
                "timestamp": "2026-01-27T12:00:00Z",
                "actual_vwc": 86.99
            },
            {
                "timestamp": "2026-01-28T12:00:00Z",
                "actual_vwc": 83.37
            },
            {
                "timestamp": "2026-01-29T12:00:00Z",
                "actual_vwc": 80.75
            },
            {
                "timestamp": "2026-01-30T12:00:00Z",
                "actual_vwc": 86.99
            },
            {
                "timestamp": "2026-01-31T12:00:00Z",
                "actual_vwc": 92.87
            },
            {
                "timestamp": "2026-02-01T12:00:00Z",
                "actual_vwc": 92.7
            },
            {
                "timestamp": "2026-02-02T12:00:00Z",
                "actual_vwc": 90.77
            },
            {
                "timestamp": "2026-02-03T12:00:00Z",
                "actual_vwc": 91.56
            },
            {
                "timestamp": "2026-02-04T12:00:00Z",
                "actual_vwc": 89.84
            },
            {
                "timestamp": "2026-02-05T12:00:00Z",
                "actual_vwc": 92.3
            },
            {
                "timestamp": "2026-02-06T12:00:00Z",
                "actual_vwc": 90.3
            },
            {
                "timestamp": "2026-02-07T12:00:00Z",
                "actual_vwc": 94.23
            },
            {
                "timestamp": "2026-02-08T12:00:00Z",
                "actual_vwc": 92.7
            },
            {
                "timestamp": "2026-02-09T12:00:00Z",
                "actual_vwc": 88.15
            },
            {
                "timestamp": "2026-02-10T12:00:00Z",
                "actual_vwc": 85.98
            },
            {
                "timestamp": "2026-02-11T12:00:00Z",
                "actual_vwc": 89.1
            },
            {
                "timestamp": "2026-02-12T12:00:00Z",
                "actual_vwc": 88.37
            },
            {
                "timestamp": "2026-02-13T12:00:00Z",
                "actual_vwc": 92.43
            },
            {
                "timestamp": "2026-02-14T12:00:00Z",
                "actual_vwc": 89.22
            },
            {
                "timestamp": "2026-02-15T12:00:00Z",
                "actual_vwc": 91.27
            },
            {
                "timestamp": "2026-02-16T12:00:00Z",
                "actual_vwc": 90.44
            },
            {
                "timestamp": "2026-02-17T12:00:00Z",
                "actual_vwc": 91.23
            },
            {
                "timestamp": "2026-02-18T12:00:00Z",
                "actual_vwc": 90.54
            },
            {
                "timestamp": "2026-02-19T12:00:00Z",
                "actual_vwc": 89.41
            },
            {
                "timestamp": "2026-02-20T12:00:00Z",
                "actual_vwc": 87.06
            },
            {
                "timestamp": "2026-02-21T12:00:00Z",
                "actual_vwc": 83.84
            },
            {
                "timestamp": "2026-02-22T12:00:00Z",
                "actual_vwc": 85.72
            },
            {
                "timestamp": "2026-02-23T12:00:00Z",
                "actual_vwc": 87.16
            },
            {
                "timestamp": "2026-02-24T12:00:00Z",
                "actual_vwc": 79.48
            },
            {
                "timestamp": "2026-02-25T12:00:00Z",
                "actual_vwc": 82.5
            },
            {
                "timestamp": "2026-02-26T12:00:00Z",
                "actual_vwc": 86.95
            },
            {
                "timestamp": "2026-02-27T12:00:00Z",
                "actual_vwc": 90.67
            },
            {
                "timestamp": "2026-02-28T12:00:00Z",
                "actual_vwc": 88.7
            },
            {
                "timestamp": "2026-03-01T12:00:00Z",
                "actual_vwc": 89.8
            },
            {
                "timestamp": "2026-03-02T12:00:00Z",
                "actual_vwc": 92.26
            },
            {
                "timestamp": "2026-03-03T12:00:00Z",
                "actual_vwc": 93.54
            },
            {
                "timestamp": "2026-03-04T12:00:00Z",
                "actual_vwc": 92.56
            },
            {
                "timestamp": "2026-03-05T12:00:00Z",
                "actual_vwc": 93.12
            },
            {
                "timestamp": "2026-03-06T12:00:00Z",
                "actual_vwc": 92.38
            },
            {
                "timestamp": "2026-03-07T12:00:00Z",
                "actual_vwc": 93.54
            },
            {
                "timestamp": "2026-03-08T12:00:00Z",
                "actual_vwc": 93.07
            },
            {
                "timestamp": "2026-03-09T12:00:00Z",
                "actual_vwc": 92.75
            },
            {
                "timestamp": "2026-03-10T12:00:00Z",
                "actual_vwc": 92.93
            },
            {
                "timestamp": "2026-03-11T12:00:00Z",
                "actual_vwc": 94.07
            },
            {
                "timestamp": "2026-03-12T12:00:00Z",
                "actual_vwc": 93.76
            }
        ],
        "test_predictions": [
            {
                "timestamp": "2026-03-13T12:00:00Z",
                "predicted_vwc_tomorrow": 94.15,
                "actual_vwc_next_day": 93.75,
                "error": -0.4014,
                "abs_error": 0.4014
            },
            {
                "timestamp": "2026-03-14T12:00:00Z",
                "predicted_vwc_tomorrow": 93.66,
                "actual_vwc_next_day": 93.3,
                "error": -0.3648,
                "abs_error": 0.3648
            },
            {
                "timestamp": "2026-03-15T12:00:00Z",
                "predicted_vwc_tomorrow": 93.15,
                "actual_vwc_next_day": 93.36,
                "error": 0.2078,
                "abs_error": 0.2078
            },
            {
                "timestamp": "2026-03-16T12:00:00Z",
                "predicted_vwc_tomorrow": 93.15,
                "actual_vwc_next_day": 92.09,
                "error": -1.0601,
                "abs_error": 1.0601
            },
            {
                "timestamp": "2026-03-17T12:00:00Z",
                "predicted_vwc_tomorrow": 91.6,
                "actual_vwc_next_day": 90.95,
                "error": -0.6533,
                "abs_error": 0.6533
            },
            {
                "timestamp": "2026-03-18T12:00:00Z",
                "predicted_vwc_tomorrow": 90.11,
                "actual_vwc_next_day": 88.32,
                "error": -1.7948,
                "abs_error": 1.7948
            },
            {
                "timestamp": "2026-03-19T12:00:00Z",
                "predicted_vwc_tomorrow": 86.69,
                "actual_vwc_next_day": 84.75,
                "error": -1.9441,
                "abs_error": 1.9441
            },
            {
                "timestamp": "2026-03-20T12:00:00Z",
                "predicted_vwc_tomorrow": 82.28,
                "actual_vwc_next_day": 75.96,
                "error": -6.3222,
                "abs_error": 6.3222
            },
            {
                "timestamp": "2026-03-21T12:00:00Z",
                "predicted_vwc_tomorrow": 71.11,
                "actual_vwc_next_day": 56.81,
                "error": -14.2961,
                "abs_error": 14.2961
            },
            {
                "timestamp": "2026-03-22T12:00:00Z",
                "predicted_vwc_tomorrow": 46.48,
                "actual_vwc_next_day": 42.28,
                "error": -4.2031,
                "abs_error": 4.2031
            },
            {
                "timestamp": "2026-03-23T12:00:00Z",
                "predicted_vwc_tomorrow": 27.62,
                "actual_vwc_next_day": 32.74,
                "error": 5.1175,
                "abs_error": 5.1175
            },
            {
                "timestamp": "2026-03-24T12:00:00Z",
                "predicted_vwc_tomorrow": 18.32,
                "actual_vwc_next_day": 25.91,
                "error": 7.5896,
                "abs_error": 7.5896
            },
            {
                "timestamp": "2026-03-25T12:00:00Z",
                "predicted_vwc_tomorrow": 15.69,
                "actual_vwc_next_day": 19.93,
                "error": 4.2463,
                "abs_error": 4.2463
            },
            {
                "timestamp": "2026-03-26T12:00:00Z",
                "predicted_vwc_tomorrow": 12.54,
                "actual_vwc_next_day": 15.08,
                "error": 2.5391,
                "abs_error": 2.5391
            }
        ]
    },
    "cluster_2": {
        "cluster_id": "cluster_2",
        "model_version": "cluster_2_vwc_tomorrow_cluster_2_vwc_tomorrow_2026-03-28",
        "split_ratio": 0.8,
        "split_index": 52,
        "split_timestamp": "2026-03-13T12:00:00Z",
        "total_rows": 66,
        "fallback_used": true,
        "train_history": [
            {
                "timestamp": "2026-01-20T12:00:00Z",
                "actual_vwc": 80.29
            },
            {
                "timestamp": "2026-01-21T12:00:00Z",
                "actual_vwc": 79.45
            },
            {
                "timestamp": "2026-01-22T12:00:00Z",
                "actual_vwc": 74.23
            },
            {
                "timestamp": "2026-01-23T12:00:00Z",
                "actual_vwc": 77.5
            },
            {
                "timestamp": "2026-01-24T12:00:00Z",
                "actual_vwc": 82.15
            },
            {
                "timestamp": "2026-01-25T12:00:00Z",
                "actual_vwc": 82.17
            },
            {
                "timestamp": "2026-01-26T12:00:00Z",
                "actual_vwc": 82.45
            },
            {
                "timestamp": "2026-01-27T12:00:00Z",
                "actual_vwc": 83.38
            },
            {
                "timestamp": "2026-01-28T12:00:00Z",
                "actual_vwc": 84.05
            },
            {
                "timestamp": "2026-01-29T12:00:00Z",
                "actual_vwc": 83.26
            },
            {
                "timestamp": "2026-01-30T12:00:00Z",
                "actual_vwc": 84.31
            },
            {
                "timestamp": "2026-01-31T12:00:00Z",
                "actual_vwc": 84.32
            },
            {
                "timestamp": "2026-02-01T12:00:00Z",
                "actual_vwc": 84.97
            },
            {
                "timestamp": "2026-02-02T12:00:00Z",
                "actual_vwc": 86.43
            },
            {
                "timestamp": "2026-02-03T12:00:00Z",
                "actual_vwc": 86.92
            },
            {
                "timestamp": "2026-02-04T12:00:00Z",
                "actual_vwc": 87.39
            },
            {
                "timestamp": "2026-02-05T12:00:00Z",
                "actual_vwc": 86.6
            },
            {
                "timestamp": "2026-02-06T12:00:00Z",
                "actual_vwc": 85.59
            },
            {
                "timestamp": "2026-02-07T12:00:00Z",
                "actual_vwc": 83.68
            },
            {
                "timestamp": "2026-02-08T12:00:00Z",
                "actual_vwc": 80.63
            },
            {
                "timestamp": "2026-02-09T12:00:00Z",
                "actual_vwc": 69.53
            },
            {
                "timestamp": "2026-02-10T12:00:00Z",
                "actual_vwc": 46.57
            },
            {
                "timestamp": "2026-02-11T12:00:00Z",
                "actual_vwc": 31.86
            },
            {
                "timestamp": "2026-02-12T12:00:00Z",
                "actual_vwc": 24.75
            },
            {
                "timestamp": "2026-02-13T12:00:00Z",
                "actual_vwc": 18.14
            },
            {
                "timestamp": "2026-02-14T12:00:00Z",
                "actual_vwc": 13.99
            },
            {
                "timestamp": "2026-02-15T12:00:00Z",
                "actual_vwc": 5.62
            },
            {
                "timestamp": "2026-02-16T12:00:00Z",
                "actual_vwc": 3.84
            },
            {
                "timestamp": "2026-02-17T12:00:00Z",
                "actual_vwc": 9.41
            },
            {
                "timestamp": "2026-02-18T12:00:00Z",
                "actual_vwc": 8.95
            },
            {
                "timestamp": "2026-02-19T12:00:00Z",
                "actual_vwc": 8.65
            },
            {
                "timestamp": "2026-02-20T12:00:00Z",
                "actual_vwc": 8.44
            },
            {
                "timestamp": "2026-02-21T12:00:00Z",
                "actual_vwc": 7.99
            },
            {
                "timestamp": "2026-02-22T12:00:00Z",
                "actual_vwc": 7.68
            },
            {
                "timestamp": "2026-02-23T12:00:00Z",
                "actual_vwc": 7.4
            },
            {
                "timestamp": "2026-02-24T12:00:00Z",
                "actual_vwc": 7.04
            },
            {
                "timestamp": "2026-02-25T12:00:00Z",
                "actual_vwc": 6.65
            },
            {
                "timestamp": "2026-02-26T12:00:00Z",
                "actual_vwc": 6.22
            },
            {
                "timestamp": "2026-02-27T12:00:00Z",
                "actual_vwc": 5.78
            },
            {
                "timestamp": "2026-02-28T12:00:00Z",
                "actual_vwc": 5.42
            },
            {
                "timestamp": "2026-03-01T12:00:00Z",
                "actual_vwc": 5.05
            },
            {
                "timestamp": "2026-03-02T12:00:00Z",
                "actual_vwc": 4.65
            },
            {
                "timestamp": "2026-03-03T12:00:00Z",
                "actual_vwc": 4.26
            },
            {
                "timestamp": "2026-03-04T12:00:00Z",
                "actual_vwc": 3.91
            },
            {
                "timestamp": "2026-03-05T12:00:00Z",
                "actual_vwc": 3.61
            },
            {
                "timestamp": "2026-03-06T12:00:00Z",
                "actual_vwc": 3.32
            },
            {
                "timestamp": "2026-03-07T12:00:00Z",
                "actual_vwc": 3.16
            },
            {
                "timestamp": "2026-03-08T12:00:00Z",
                "actual_vwc": 2.96
            },
            {
                "timestamp": "2026-03-09T12:00:00Z",
                "actual_vwc": 2.79
            },
            {
                "timestamp": "2026-03-10T12:00:00Z",
                "actual_vwc": 2.6
            },
            {
                "timestamp": "2026-03-11T12:00:00Z",
                "actual_vwc": 2.48
            },
            {
                "timestamp": "2026-03-12T12:00:00Z",
                "actual_vwc": 2.37
            }
        ],
        "test_predictions": [
            {
                "timestamp": "2026-03-13T12:00:00Z",
                "predicted_vwc_tomorrow": 2.14,
                "actual_vwc_next_day": 2.14,
                "error": 0.0006,
                "abs_error": 0.0006
            },
            {
                "timestamp": "2026-03-14T12:00:00Z",
                "predicted_vwc_tomorrow": 2.03,
                "actual_vwc_next_day": 2.05,
                "error": 0.0277,
                "abs_error": 0.0277
            },
            {
                "timestamp": "2026-03-15T12:00:00Z",
                "predicted_vwc_tomorrow": 1.95,
                "actual_vwc_next_day": 1.92,
                "error": -0.0267,
                "abs_error": 0.0267
            },
            {
                "timestamp": "2026-03-16T12:00:00Z",
                "predicted_vwc_tomorrow": 1.81,
                "actual_vwc_next_day": 1.89,
                "error": 0.0795,
                "abs_error": 0.0795
            },
            {
                "timestamp": "2026-03-17T12:00:00Z",
                "predicted_vwc_tomorrow": 1.8,
                "actual_vwc_next_day": 1.84,
                "error": 0.0339,
                "abs_error": 0.0339
            },
            {
                "timestamp": "2026-03-18T12:00:00Z",
                "predicted_vwc_tomorrow": 1.77,
                "actual_vwc_next_day": 1.77,
                "error": 0.0004,
                "abs_error": 0.0004
            },
            {
                "timestamp": "2026-03-19T12:00:00Z",
                "predicted_vwc_tomorrow": 1.72,
                "actual_vwc_next_day": 1.66,
                "error": -0.0617,
                "abs_error": 0.0617
            },
            {
                "timestamp": "2026-03-20T12:00:00Z",
                "predicted_vwc_tomorrow": 1.58,
                "actual_vwc_next_day": 1.55,
                "error": -0.0349,
                "abs_error": 0.0349
            },
            {
                "timestamp": "2026-03-21T12:00:00Z",
                "predicted_vwc_tomorrow": 1.45,
                "actual_vwc_next_day": 1.42,
                "error": -0.0266,
                "abs_error": 0.0266
            },
            {
                "timestamp": "2026-03-22T12:00:00Z",
                "predicted_vwc_tomorrow": 1.31,
                "actual_vwc_next_day": 1.36,
                "error": 0.0518,
                "abs_error": 0.0518
            },
            {
                "timestamp": "2026-03-23T12:00:00Z",
                "predicted_vwc_tomorrow": 1.26,
                "actual_vwc_next_day": 1.27,
                "error": 0.0138,
                "abs_error": 0.0138
            },
            {
                "timestamp": "2026-03-24T12:00:00Z",
                "predicted_vwc_tomorrow": 1.18,
                "actual_vwc_next_day": 1.23,
                "error": 0.0518,
                "abs_error": 0.0518
            },
            {
                "timestamp": "2026-03-25T12:00:00Z",
                "predicted_vwc_tomorrow": 1.17,
                "actual_vwc_next_day": 1.21,
                "error": 0.0394,
                "abs_error": 0.0394
            },
            {
                "timestamp": "2026-03-26T12:00:00Z",
                "predicted_vwc_tomorrow": 1.16,
                "actual_vwc_next_day": 1.19,
                "error": 0.0286,
                "abs_error": 0.0286
            }
        ]
    },
    "cluster_3": {
        "cluster_id": "cluster_3",
        "model_version": "cluster_3_vwc_tomorrow_cluster_3_vwc_tomorrow_2026-03-28",
        "split_ratio": 0.8,
        "split_index": 54,
        "split_timestamp": "2026-03-13T12:00:00Z",
        "total_rows": 68,
        "fallback_used": true,
        "train_history": [
            {
                "timestamp": "2026-01-18T12:00:00Z",
                "actual_vwc": 0.91
            },
            {
                "timestamp": "2026-01-19T12:00:00Z",
                "actual_vwc": 0.86
            },
            {
                "timestamp": "2026-01-20T12:00:00Z",
                "actual_vwc": 0.83
            },
            {
                "timestamp": "2026-01-21T12:00:00Z",
                "actual_vwc": 0.79
            },
            {
                "timestamp": "2026-01-22T12:00:00Z",
                "actual_vwc": 0.76
            },
            {
                "timestamp": "2026-01-23T12:00:00Z",
                "actual_vwc": 0.72
            },
            {
                "timestamp": "2026-01-24T12:00:00Z",
                "actual_vwc": 0.71
            },
            {
                "timestamp": "2026-01-25T12:00:00Z",
                "actual_vwc": 0.73
            },
            {
                "timestamp": "2026-01-26T12:00:00Z",
                "actual_vwc": 0.72
            },
            {
                "timestamp": "2026-01-27T12:00:00Z",
                "actual_vwc": 0.69
            },
            {
                "timestamp": "2026-01-28T12:00:00Z",
                "actual_vwc": 0.67
            },
            {
                "timestamp": "2026-01-29T12:00:00Z",
                "actual_vwc": 0.64
            },
            {
                "timestamp": "2026-01-30T12:00:00Z",
                "actual_vwc": 0.6
            },
            {
                "timestamp": "2026-01-31T12:00:00Z",
                "actual_vwc": 0.57
            },
            {
                "timestamp": "2026-02-01T12:00:00Z",
                "actual_vwc": 0.55
            },
            {
                "timestamp": "2026-02-02T12:00:00Z",
                "actual_vwc": 0.52
            },
            {
                "timestamp": "2026-02-03T12:00:00Z",
                "actual_vwc": 0.49
            },
            {
                "timestamp": "2026-02-04T12:00:00Z",
                "actual_vwc": 0.46
            },
            {
                "timestamp": "2026-02-05T12:00:00Z",
                "actual_vwc": 0.44
            },
            {
                "timestamp": "2026-02-06T12:00:00Z",
                "actual_vwc": 0.24
            },
            {
                "timestamp": "2026-02-07T12:00:00Z",
                "actual_vwc": 0.21
            },
            {
                "timestamp": "2026-02-08T12:00:00Z",
                "actual_vwc": 0.21
            },
            {
                "timestamp": "2026-02-09T12:00:00Z",
                "actual_vwc": 0.21
            },
            {
                "timestamp": "2026-02-10T12:00:00Z",
                "actual_vwc": 0.23
            },
            {
                "timestamp": "2026-02-11T12:00:00Z",
                "actual_vwc": 0.25
            },
            {
                "timestamp": "2026-02-12T12:00:00Z",
                "actual_vwc": 0.27
            },
            {
                "timestamp": "2026-02-13T12:00:00Z",
                "actual_vwc": 0.27
            },
            {
                "timestamp": "2026-02-14T12:00:00Z",
                "actual_vwc": 0.24
            },
            {
                "timestamp": "2026-02-15T12:00:00Z",
                "actual_vwc": 0.21
            },
            {
                "timestamp": "2026-02-16T12:00:00Z",
                "actual_vwc": 0.21
            },
            {
                "timestamp": "2026-02-17T12:00:00Z",
                "actual_vwc": 0.22
            },
            {
                "timestamp": "2026-02-18T12:00:00Z",
                "actual_vwc": 0.21
            },
            {
                "timestamp": "2026-02-19T12:00:00Z",
                "actual_vwc": 0.19
            },
            {
                "timestamp": "2026-02-20T12:00:00Z",
                "actual_vwc": 0.17
            },
            {
                "timestamp": "2026-02-21T12:00:00Z",
                "actual_vwc": 0.19
            },
            {
                "timestamp": "2026-02-22T12:00:00Z",
                "actual_vwc": 0.2
            },
            {
                "timestamp": "2026-02-23T12:00:00Z",
                "actual_vwc": 0.2
            },
            {
                "timestamp": "2026-02-24T12:00:00Z",
                "actual_vwc": 0.2
            },
            {
                "timestamp": "2026-02-25T12:00:00Z",
                "actual_vwc": 0.19
            },
            {
                "timestamp": "2026-02-26T12:00:00Z",
                "actual_vwc": 0.19
            },
            {
                "timestamp": "2026-02-27T12:00:00Z",
                "actual_vwc": 0.18
            },
            {
                "timestamp": "2026-02-28T12:00:00Z",
                "actual_vwc": 0.18
            },
            {
                "timestamp": "2026-03-01T12:00:00Z",
                "actual_vwc": 0.17
            },
            {
                "timestamp": "2026-03-02T12:00:00Z",
                "actual_vwc": 0.16
            },
            {
                "timestamp": "2026-03-03T12:00:00Z",
                "actual_vwc": 0.13
            },
            {
                "timestamp": "2026-03-04T12:00:00Z",
                "actual_vwc": 0.1
            },
            {
                "timestamp": "2026-03-05T12:00:00Z",
                "actual_vwc": 0.08
            },
            {
                "timestamp": "2026-03-06T12:00:00Z",
                "actual_vwc": 0.08
            },
            {
                "timestamp": "2026-03-07T12:00:00Z",
                "actual_vwc": 0.07
            },
            {
                "timestamp": "2026-03-08T12:00:00Z",
                "actual_vwc": 0.08
            },
            {
                "timestamp": "2026-03-09T12:00:00Z",
                "actual_vwc": 0.08
            },
            {
                "timestamp": "2026-03-10T12:00:00Z",
                "actual_vwc": 0.09
            },
            {
                "timestamp": "2026-03-11T12:00:00Z",
                "actual_vwc": 0.09
            },
            {
                "timestamp": "2026-03-12T12:00:00Z",
                "actual_vwc": 0.09
            }
        ],
        "test_predictions": [
            {
                "timestamp": "2026-03-13T12:00:00Z",
                "predicted_vwc_tomorrow": 0.08,
                "actual_vwc_next_day": 0.07,
                "error": -0.0029,
                "abs_error": 0.0029
            },
            {
                "timestamp": "2026-03-14T12:00:00Z",
                "predicted_vwc_tomorrow": 0.06,
                "actual_vwc_next_day": 0.07,
                "error": 0.0026,
                "abs_error": 0.0026
            },
            {
                "timestamp": "2026-03-15T12:00:00Z",
                "predicted_vwc_tomorrow": 0.06,
                "actual_vwc_next_day": 0.06,
                "error": 0.0003,
                "abs_error": 0.0003
            },
            {
                "timestamp": "2026-03-16T12:00:00Z",
                "predicted_vwc_tomorrow": 0.05,
                "actual_vwc_next_day": 0.05,
                "error": 0.0014,
                "abs_error": 0.0014
            },
            {
                "timestamp": "2026-03-17T12:00:00Z",
                "predicted_vwc_tomorrow": 0.05,
                "actual_vwc_next_day": 0.05,
                "error": -0.002,
                "abs_error": 0.002
            },
            {
                "timestamp": "2026-03-18T12:00:00Z",
                "predicted_vwc_tomorrow": 0.04,
                "actual_vwc_next_day": 0.05,
                "error": 0.0062,
                "abs_error": 0.0062
            },
            {
                "timestamp": "2026-03-19T12:00:00Z",
                "predicted_vwc_tomorrow": 0.04,
                "actual_vwc_next_day": 0.03,
                "error": -0.0081,
                "abs_error": 0.0081
            },
            {
                "timestamp": "2026-03-20T12:00:00Z",
                "predicted_vwc_tomorrow": 0.03,
                "actual_vwc_next_day": 0.03,
                "error": -0.002,
                "abs_error": 0.002
            },
            {
                "timestamp": "2026-03-21T12:00:00Z",
                "predicted_vwc_tomorrow": 0.02,
                "actual_vwc_next_day": 0.02,
                "error": 0.0054,
                "abs_error": 0.0054
            },
            {
                "timestamp": "2026-03-22T12:00:00Z",
                "predicted_vwc_tomorrow": 0.01,
                "actual_vwc_next_day": 0.02,
                "error": 0.0061,
                "abs_error": 0.0061
            },
            {
                "timestamp": "2026-03-23T12:00:00Z",
                "predicted_vwc_tomorrow": 0.02,
                "actual_vwc_next_day": 0.02,
                "error": 0.001,
                "abs_error": 0.001
            },
            {
                "timestamp": "2026-03-24T12:00:00Z",
                "predicted_vwc_tomorrow": 0.02,
                "actual_vwc_next_day": 0.01,
                "error": -0.0103,
                "abs_error": 0.0103
            },
            {
                "timestamp": "2026-03-25T12:00:00Z",
                "predicted_vwc_tomorrow": 0,
                "actual_vwc_next_day": 0.01,
                "error": 0.0057,
                "abs_error": 0.0057
            },
            {
                "timestamp": "2026-03-26T12:00:00Z",
                "predicted_vwc_tomorrow": 0,
                "actual_vwc_next_day": 0,
                "error": 0,
                "abs_error": 0
            }
        ]
    }
}
} as const;

