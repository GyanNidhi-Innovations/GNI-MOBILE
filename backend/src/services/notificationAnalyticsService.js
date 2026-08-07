import mongoose from "mongoose";

import Notification from "../models/Notification.js";
import NotificationCampaign from "../models/NotificationCampaign.js";
import NotificationDelivery from "../models/NotificationDelivery.js";
import Registration from "../models/Registration.js";

import {
  buildUserDeliveryMap,
} from "./pushNotificationService.js";

export function campaignActorFromRequest(
  req,
) {
  return {
    adminId:
      String(
        req.internalAdmin
          ?.adminId ||
          "",
      ),

    email:
      String(
        req.internalAdmin
          ?.email ||
          "",
      )
        .trim()
        .toLowerCase(),
  };
}

export async function createNotificationCampaign({
  source = "general",
  targetType,
  targetValue = "",
  title,
  body,
  type = "system",
  screen = "notifications",
  eventId = null,
  analyticsAvailable = true,
  createdBy = {},
}) {
  return NotificationCampaign.create({
    source,
    targetType,
    targetValue:
      String(
        targetValue || "",
      ),
    title,
    body,
    type,
    screen,
    eventId,
    analyticsAvailable,
    createdBy,
    status: "processing",
    startedAt: new Date(),
  });
}

function notificationByUserMap(
  inboxDocuments = [],
) {
  return new Map(
    inboxDocuments.map(
      (document) => [
        String(
          document.userId,
        ),
        document,
      ],
    ),
  );
}

async function insertDeliveryDocuments(
  deliveryDocuments,
) {
  if (
    deliveryDocuments.length === 0
  ) {
    return;
  }

  try {
    await NotificationDelivery
      .insertMany(
        deliveryDocuments,
        {
          ordered: false,
        },
      );
  } catch (error) {
    /*
     * A retry can encounter a duplicate
     * campaign/installation pair. Preserve all
     * non-duplicate failures.
     */
    if (
      error?.code !== 11000 &&
      !Array.isArray(
        error?.writeErrors,
      )
    ) {
      throw error;
    }
  }
}

export async function finalizeCampaignWithPushResult({
  campaign,
  inboxDocuments = [],
  pushResult,
}) {
  const now = new Date();

  const inboxByUser =
    notificationByUserMap(
      inboxDocuments,
    );

  const deliveryMap =
    buildUserDeliveryMap(
      pushResult.results,
    );

  const notificationOperations =
    inboxDocuments.map(
      (document) => {
        const userDelivery =
          deliveryMap.get(
            String(
              document.userId,
            ),
          );

        const acceptedCount =
          userDelivery
            ?.successCount ||
          0;

        const rejectedCount =
          userDelivery
            ?.failureCount ||
          0;

        const accepted =
          acceptedCount > 0;

        return {
          updateOne: {
            filter: {
              _id:
                document._id,
            },

            update: {
              $set: {
                deliveryStatus:
                  accepted
                    ? "sent"
                    : "failed",

                acceptedDeviceCount:
                  acceptedCount,

                rejectedDeviceCount:
                  rejectedCount,

                sentAt: now,

                failureReason:
                  accepted
                    ? ""
                    : (
                        userDelivery
                          ?.errors ||
                        []
                      ).join(
                        ", ",
                      ) ||
                      "FCM rejected every active device",
              },
            },
          },
        };
      },
    );

  if (
    notificationOperations.length >
    0
  ) {
    await Notification.bulkWrite(
      notificationOperations,
    );
  }

  const deliveryDocuments =
    pushResult.results.map(
      (result) => {
        const inbox =
          inboxByUser.get(
            String(
              result.userId,
            ),
          );

        return {
          campaignId:
            campaign._id,

          notificationId:
            inbox?._id ||
            null,

          userId:
            mongoose.Types
              .ObjectId.isValid(
                result.userId,
              )
              ? result.userId
              : null,

          installationId:
            result.installationId,

          deviceName:
            result.deviceName,

          platform:
            result.platform,

          tokenSuffix:
            result.tokenSuffix,

          fcmStatus:
            result.success
              ? "accepted"
              : "rejected",

          fcmMessageId:
            result.messageId ||
            "",

          errorCode:
            result.errorCode ||
            "",

          errorMessage:
            result.errorMessage ||
            "",

          processedAt: now,
        };
      },
    );

  await insertDeliveryDocuments(
    deliveryDocuments,
  );

  const acceptedUsers =
    inboxDocuments.filter(
      (document) =>
        (
          deliveryMap.get(
            String(
              document.userId,
            ),
          )?.successCount ||
          0
        ) > 0,
    ).length;

  const totalUsers =
    inboxDocuments.length;

  const status =
    pushResult.successCount === 0
      ? "failed"
      : pushResult.failureCount > 0
        ? "partial"
        : "completed";

  campaign.status = status;
  campaign.totalUsers =
    totalUsers;
  campaign.totalDevices =
    pushResult
      .uniqueDevices.length;
  campaign.acceptedDevices =
    pushResult.successCount;
  campaign.rejectedDevices =
    pushResult.failureCount;
  campaign.acceptedUsers =
    acceptedUsers;
  campaign.failedUsers =
    Math.max(
      totalUsers -
        acceptedUsers,
      0,
    );
  campaign.invalidTokensDisabled =
    pushResult
      .invalidTokensDisabled;
  campaign.failureReason =
    status === "failed"
      ? "FCM rejected every targeted device"
      : "";
  campaign.completedAt = now;

  await campaign.save();

  return {
    campaignId:
      String(
        campaign._id,
      ),

    status:
      campaign.status,

    totalUsers:
      campaign.totalUsers,

    totalDevices:
      campaign.totalDevices,

    successCount:
      campaign.acceptedDevices,

    failureCount:
      campaign.rejectedDevices,

    acceptedUsers:
      campaign.acceptedUsers,

    failedUsers:
      campaign.failedUsers,

    invalidTokensDisabled:
      campaign
        .invalidTokensDisabled,
  };
}

export async function failCampaignPush({
  campaign,
  inboxDocuments = [],
  devices = [],
  error,
}) {
  const now = new Date();

  const failureMessage =
    String(
      error?.message ||
        error ||
        "Push processing failed",
    ).slice(0, 2000);

  const inboxByUser =
    notificationByUserMap(
      inboxDocuments,
    );

  if (
    inboxDocuments.length > 0
  ) {
    const deviceCountByUser =
      new Map();

    devices.forEach((device) => {
      const userId = String(
        device.userId || "",
      );

      if (!userId) return;

      deviceCountByUser.set(
        userId,
        (deviceCountByUser.get(userId) || 0) + 1,
      );
    });

    await Notification.bulkWrite(
      inboxDocuments.map((document) => ({
        updateOne: {
          filter: {
            _id: document._id,
          },
          update: {
            $set: {
              deliveryStatus: "failed",
              acceptedDeviceCount: 0,
              rejectedDeviceCount:
                deviceCountByUser.get(
                  String(document.userId),
                ) || 0,
              sentAt: now,
              failureReason: failureMessage,
            },
          },
        },
      })),
    );
  }

  const deliveryDocuments =
    devices
      .filter(
        (device) =>
          device
            ?.installationId,
      )
      .map((device) => {
        const userId =
          String(
            device.userId ||
              "",
          );

        const inbox =
          inboxByUser.get(
            userId,
          );

        return {
          campaignId:
            campaign._id,

          notificationId:
            inbox?._id ||
            null,

          userId:
            mongoose.Types
              .ObjectId.isValid(
                userId,
              )
              ? userId
              : null,

          installationId:
            device.installationId,

          deviceName:
            device.deviceName ||
            "",

          platform:
            [
              "android",
              "ios",
              "unknown",
            ].includes(
              device.platform,
            )
              ? device.platform
              : "unknown",

          tokenSuffix:
            String(
              device.token ||
                "",
            ).slice(-10),

          fcmStatus:
            "rejected",

          errorCode:
            "push-processing-error",

          errorMessage:
            failureMessage,

          processedAt: now,
        };
      });

  await insertDeliveryDocuments(
    deliveryDocuments,
  );

  campaign.status = "failed";
  campaign.totalUsers =
    inboxDocuments.length;
  campaign.totalDevices =
    devices.length;
  campaign.acceptedDevices = 0;
  campaign.rejectedDevices =
    devices.length;
  campaign.acceptedUsers = 0;
  campaign.failedUsers =
    inboxDocuments.length;
  campaign.failureReason =
    failureMessage;
  campaign.completedAt = now;

  await campaign.save();

  return {
    campaignId:
      String(
        campaign._id,
      ),

    status: "failed",

    totalUsers:
      campaign.totalUsers,

    totalDevices:
      campaign.totalDevices,

    successCount: 0,

    failureCount:
      campaign.rejectedDevices,

    acceptedUsers: 0,

    failedUsers:
      campaign.failedUsers,

    invalidTokensDisabled:
      campaign
        .invalidTokensDisabled,

    error:
      failureMessage,
  };
}

function escapeRegex(value) {
  return String(
    value || "",
  ).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

const IST_OFFSET_MS =
  330 * 60 * 1000;

function parseAnalyticsDate(
  value,
  {
    endOfDay = false,
  } = {},
) {
  if (!value) {
    return null;
  }

  const stringValue =
    String(value);

  const dateOnlyMatch =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      stringValue,
    );

  if (dateOnlyMatch) {
    const year =
      Number(
        dateOnlyMatch[1],
      );

    const month =
      Number(
        dateOnlyMatch[2],
      );

    const day =
      Number(
        dateOnlyMatch[3],
      );

    const utcTime =
      endOfDay
        ? Date.UTC(
            year,
            month - 1,
            day,
            23,
            59,
            59,
            999,
          )
        : Date.UTC(
            year,
            month - 1,
            day,
            0,
            0,
            0,
            0,
          );

    /*
     * Convert selected IST date/time
     * to the real UTC instant.
     */
    return new Date(
      utcTime -
        IST_OFFSET_MS,
    );
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

function dateRangeFilter(
  query = {},
) {
  const createdAt = {};

  const from =
    parseAnalyticsDate(
      query.from,
      {
        endOfDay: false,
      },
    );

  const to =
    parseAnalyticsDate(
      query.to,
      {
        endOfDay: true,
      },
    );

  if (from) {
    createdAt.$gte =
      from;
  }

  if (to) {
    createdAt.$lte =
      to;
  }

  return Object.keys(
    createdAt,
  ).length
    ? createdAt
    : null;
}

export function buildCampaignFilter(
  query = {},
  {
    includeSearch = true,
  } = {},
) {
  const filter = {};

  if (
    [
      "general",
      "event",
      "topic",
    ].includes(
      query.source,
    )
  ) {
    filter.source =
      query.source;
  }

  if (
    [
      "all",
      "user",
      "topic",
    ].includes(
      query.targetType,
    )
  ) {
    filter.targetType =
      query.targetType;
  }

  if (
    [
      "processing",
      "completed",
      "partial",
      "failed",
    ].includes(
      query.status,
    )
  ) {
    filter.status =
      query.status;
  }

  const createdAt =
    dateRangeFilter(query);

  if (createdAt) {
    filter.createdAt =
      createdAt;
  }

  const search =
    String(
      query.search || "",
    ).trim();

  if (
    includeSearch &&
    search
  ) {
    const pattern =
      new RegExp(
        escapeRegex(search),
        "i",
      );

    filter.$or = [
      {
        title:
          pattern,
      },
      {
        body:
          pattern,
      },
      {
        targetValue:
          pattern,
      },
    ];
  }

  return filter;
}

async function dynamicMetricsByCampaign(
  campaignIds,
) {
  if (
    campaignIds.length === 0
  ) {
    return new Map();
  }

  const rows =
    await Notification.aggregate([
      {
        $match: {
          campaignId: {
            $in:
              campaignIds,
          },
        },
      },
      {
        $group: {
          _id:
            "$campaignId",

          recipientRecords: {
            $sum: 1,
          },

          openedUsers: {
            $sum: {
              $cond: [
                {
                  $ne: [
                    "$openedAt",
                    null,
                  ],
                },
                1,
                0,
              ],
            },
          },

          readUsers: {
            $sum: {
              $cond: [
                "$read",
                1,
                0,
              ],
            },
          },

          unreadUsers: {
            $sum: {
              $cond: [
                "$read",
                0,
                1,
              ],
            },
          },
        },
      },
    ]);

  return new Map(
    rows.map((row) => [
      String(row._id),
      {
        recipientRecords:
          row.recipientRecords ||
          0,

        openedUsers:
          row.openedUsers ||
          0,

        readUsers:
          row.readUsers ||
          0,

        unreadUsers:
          row.unreadUsers ||
          0,
      },
    ]),
  );
}

function attachDynamicMetrics(
  campaign,
  metrics,
) {
  return {
    ...campaign,

    openedUsers:
      metrics?.openedUsers ||
      0,

    readUsers:
      metrics?.readUsers ||
      0,

    unreadUsers:
      metrics?.unreadUsers ||
      0,

    recipientRecords:
      metrics
        ?.recipientRecords ||
      0,
  };
}

function metricRate(
  numerator,
  denominator,
) {
  const total = Number(
    denominator || 0,
  );

  if (total <= 0) {
    return 0;
  }

  return Number(
    (
      (Number(numerator || 0) /
        total) *
      100
    ).toFixed(1),
  );
}

async function crossCampaignMetrics(
  campaignIds,
) {
  if (
    campaignIds.length === 0
  ) {
    return {
      uniqueRecipients: 0,
      recipientSends: 0,
      uniqueDevices: 0,
      deviceSends: 0,
      acceptedByFcm: 0,
      failedDeviceSends: 0,
      notificationOpens: 0,
      uniqueOpeners: 0,
      alertsRead: 0,
      uniqueReaders: 0,
      alertsUnread: 0,
    };
  }

  const notificationFilter = {
    campaignId: {
      $in: campaignIds,
    },
  };

  const deliveryFilter = {
    campaignId: {
      $in: campaignIds,
    },
  };

  const [
    uniqueRecipientIds,
    recipientSends,
    notificationOpens,
    uniqueOpenerIds,
    alertsRead,
    uniqueReaderIds,
    alertsUnread,
    uniqueInstallationIds,
    deviceSends,
    acceptedByFcm,
    failedDeviceSends,
  ] = await Promise.all([
    Notification.distinct(
      "userId",
      notificationFilter,
    ),

    Notification.countDocuments(
      notificationFilter,
    ),

    Notification.countDocuments({
      ...notificationFilter,
      openedAt: {
        $ne: null,
      },
    }),

    Notification.distinct(
      "userId",
      {
        ...notificationFilter,
        openedAt: {
          $ne: null,
        },
      },
    ),

    Notification.countDocuments({
      ...notificationFilter,
      read: true,
    }),

    Notification.distinct(
      "userId",
      {
        ...notificationFilter,
        read: true,
      },
    ),

    Notification.countDocuments({
      ...notificationFilter,
      read: false,
    }),

    NotificationDelivery.distinct(
      "installationId",
      {
        ...deliveryFilter,
        installationId: {
          $nin: [
            "",
            null,
          ],
        },
      },
    ),

    NotificationDelivery.countDocuments(
      deliveryFilter,
    ),

    NotificationDelivery.countDocuments({
      ...deliveryFilter,
      fcmStatus:
        "accepted",
    }),

    NotificationDelivery.countDocuments({
      ...deliveryFilter,
      fcmStatus:
        "rejected",
    }),
  ]);

  return {
    uniqueRecipients:
      uniqueRecipientIds.filter(
        Boolean,
      ).length,

    recipientSends,

    uniqueDevices:
      uniqueInstallationIds.filter(
        Boolean,
      ).length,

    deviceSends,
    acceptedByFcm,
    failedDeviceSends,
    notificationOpens,

    uniqueOpeners:
      uniqueOpenerIds.filter(
        Boolean,
      ).length,

    alertsRead,

    uniqueReaders:
      uniqueReaderIds.filter(
        Boolean,
      ).length,

    alertsUnread,
  };
}

export async function getAnalyticsOverview(
  query = {},
) {
  const filter =
    buildCampaignFilter(
      query,
    );

  const campaigns =
    await NotificationCampaign
      .find(filter)
      .select(
        "_id source status analyticsAvailable",
      )
      .lean();

  const campaignIds =
    campaigns.map(
      (campaign) =>
        campaign._id,
    );

  const exact =
    await crossCampaignMetrics(
      campaignIds,
    );

  const statusBreakdown = {
    completed: 0,
    partial: 0,
    failed: 0,
    processing: 0,
  };

  const sourceBreakdown = {
    general: 0,
    event: 0,
    topic: 0,
  };

  let topicReports = 0;

  campaigns.forEach(
    (campaign) => {
      if (
        statusBreakdown[
          campaign.status
        ] !== undefined
      ) {
        statusBreakdown[
          campaign.status
        ] += 1;
      }

      if (
        sourceBreakdown[
          campaign.source
        ] !== undefined
      ) {
        sourceBreakdown[
          campaign.source
        ] += 1;
      }

      if (
        campaign.analyticsAvailable ===
        false
      ) {
        topicReports += 1;
      }
    },
  );

  const overview = {
    totalCampaigns:
      campaigns.length,

    uniqueRecipients:
      exact.uniqueRecipients,

    recipientSends:
      exact.recipientSends,

    uniqueDevices:
      exact.uniqueDevices,

    deviceSends:
      exact.deviceSends,

    acceptedByFcm:
      exact.acceptedByFcm,

    failedDeviceSends:
      exact.failedDeviceSends,

    notificationOpens:
      exact.notificationOpens,

    uniqueOpeners:
      exact.uniqueOpeners,

    alertsRead:
      exact.alertsRead,

    uniqueReaders:
      exact.uniqueReaders,

    alertsUnread:
      exact.alertsUnread,

    deliveryAcceptanceRate:
      metricRate(
        exact.acceptedByFcm,
        exact.deviceSends,
      ),

    notificationOpenRate:
      metricRate(
        exact.notificationOpens,
        exact.recipientSends,
      ),

    alertsReadRate:
      metricRate(
        exact.alertsRead,
        exact.recipientSends,
      ),

    topicReports,
    statusBreakdown,
    sourceBreakdown,

    /*
     * Backward-compatible aliases for the first
     * Notification Insights frontend.
     *
     * IMPORTANT: these are send/recipient record
     * totals across campaigns, not unique people
     * or unique devices.
     */
    totalUsers:
      exact.recipientSends,

    totalDevices:
      exact.deviceSends,

    acceptedDevices:
      exact.acceptedByFcm,

    rejectedDevices:
      exact.failedDeviceSends,

    openedUsers:
      exact.notificationOpens,

    readUsers:
      exact.alertsRead,

    unreadUsers:
      exact.alertsUnread,

    completedCampaigns:
      statusBreakdown.completed,

    partialCampaigns:
      statusBreakdown.partial,

    failedCampaigns:
      statusBreakdown.failed,
  };

  return overview;
}

function normalizeTrendDays(
  value,
) {
  const days =
    Number(value);

  if (
    [
      1,
      7,
      30,
      90,
    ].includes(days)
  ) {
    return days;
  }

  return 30;
}

function shiftToIst(
  value,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return new Date(
    date.getTime() +
      IST_OFFSET_MS,
  );
}

function pad2(value) {
  return String(value).padStart(
    2,
    "0",
  );
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function dayKeyFromShifted(
  date,
) {
  return [
    date.getUTCFullYear(),
    pad2(
      date.getUTCMonth() +
        1,
    ),
    pad2(
      date.getUTCDate(),
    ),
  ].join("-");
}

function beginningOfTrendRange(
  days,
) {
  const shiftedNow =
    shiftToIst(
      new Date(),
    );

  shiftedNow.setUTCHours(
    0,
    0,
    0,
    0,
  );

  shiftedNow.setUTCDate(
    shiftedNow.getUTCDate() -
      (days - 1),
  );

  return new Date(
    shiftedNow.getTime() -
      IST_OFFSET_MS,
  );
}

function trendRangeBounds(
  query,
  days,
) {
  const explicit =
    dateRangeFilter(
      query,
    );

  return {
    from:
      explicit?.$gte ||
      beginningOfTrendRange(
        days,
      ),

    to:
      explicit?.$lte ||
      new Date(),
  };
}

function resolveTrendGroupBy(
  requested,
  bounds,
) {
  if (
    [
      "day",
      "week",
      "month",
    ].includes(
      requested,
    )
  ) {
    return requested;
  }

  const totalDays =
    Math.max(
      1,
      Math.ceil(
        (
          bounds.to.getTime() -
          bounds.from.getTime()
        ) /
          (
            24 *
            60 *
            60 *
            1000
          ),
      ) + 1,
    );

  /*
   * Automatic grouping:
   *
   * <= 31 days  -> Daily
   * <= 120 days -> Weekly
   * > 120 days  -> Monthly
   */
  if (totalDays <= 31) {
    return "day";
  }

  if (totalDays <= 120) {
    return "week";
  }

  return "month";
}

function periodInfo(
  value,
  groupBy,
) {
  const shifted =
    shiftToIst(
      value,
    );

  if (!shifted) {
    return null;
  }

  const year =
    shifted.getUTCFullYear();

  const month =
    shifted.getUTCMonth();

  const day =
    shifted.getUTCDate();

  if (
    groupBy === "month"
  ) {
    return {
      period:
        `${year}-${pad2(
          month + 1,
        )}`,

      label:
        `${MONTH_NAMES[month]} ${year}`,
    };
  }

  if (
    groupBy === "week"
  ) {
    const monday =
      new Date(
        shifted,
      );

    const weekday =
      (
        monday.getUTCDay() +
        6
      ) % 7;

    monday.setUTCDate(
      monday.getUTCDate() -
        weekday,
    );

    const sunday =
      new Date(
        monday,
      );

    sunday.setUTCDate(
      sunday.getUTCDate() +
        6,
    );

    return {
      period:
        dayKeyFromShifted(
          monday,
        ),

      label:
        `${pad2(
          monday.getUTCDate(),
        )} ${
          MONTH_NAMES[
            monday.getUTCMonth()
          ]
        } – ${pad2(
          sunday.getUTCDate(),
        )} ${
          MONTH_NAMES[
            sunday.getUTCMonth()
          ]
        }`,
    };
  }

  return {
    period:
      `${year}-${pad2(
        month + 1,
      )}-${pad2(day)}`,

    label:
      `${pad2(day)} ${
        MONTH_NAMES[month]
      }`,
  };
}

function emptyTrendRow(
  period,
  label,
) {
  return {
    period,
    label,

    /*
     * Keep date for temporary
     * frontend compatibility.
     */
    date: period,

    notificationsSent: 0,
    recipientSends: 0,

    deviceSends: 0,

    acceptedByFcm: 0,

    failed: 0,

    notificationOpens: 0,

    alertsRead: 0,
  };
}

export async function getAnalyticsTrend(
  query = {},
) {
  const days =
    normalizeTrendDays(
      query.days,
    );

  const bounds =
    trendRangeBounds(
      query,
      days,
    );

  const groupBy =
    resolveTrendGroupBy(
      String(
        query.groupBy ||
          "auto",
      ),
      bounds,
    );

  const filter =
    buildCampaignFilter({
      ...query,

      from:
        bounds.from,

      to:
        bounds.to,
    });

  filter.createdAt = {
    $gte:
      bounds.from,

    $lte:
      bounds.to,
  };

  const campaigns =
    await NotificationCampaign
      .find(filter)
      .select(
        "_id createdAt totalDevices acceptedDevices rejectedDevices analyticsAvailable",
      )
      .sort({
        createdAt: 1,
      })
      .lean();

  const metricsMap =
    await dynamicMetricsByCampaign(
      campaigns.map(
        (campaign) =>
          campaign._id,
      ),
    );

  const rows =
    new Map();

  /*
   * Pre-create empty periods so
   * days/weeks/months with zero sends
   * still appear in charts.
   */
  let cursor =
    new Date(
      bounds.from,
    );

  while (
    cursor <=
    bounds.to
  ) {
    const info =
      periodInfo(
        cursor,
        groupBy,
      );

    if (
      info &&
      !rows.has(
        info.period,
      )
    ) {
      rows.set(
        info.period,
        emptyTrendRow(
          info.period,
          info.label,
        ),
      );
    }

    cursor =
      new Date(
        cursor.getTime() +
          24 *
            60 *
            60 *
            1000,
      );
  }

  campaigns.forEach(
    (campaign) => {
      const info =
        periodInfo(
          campaign.createdAt,
          groupBy,
        );

      if (!info) {
        return;
      }

      if (
        !rows.has(
          info.period,
        )
      ) {
        rows.set(
          info.period,
          emptyTrendRow(
            info.period,
            info.label,
          ),
        );
      }

      const row =
        rows.get(
          info.period,
        );

      const dynamic =
        metricsMap.get(
          String(
            campaign._id,
          ),
        );

      row.notificationsSent +=
        1;

      row.recipientSends +=
        dynamic
          ?.recipientRecords ||
        0;

      row.deviceSends +=
        campaign
          .totalDevices ||
        0;

      row.acceptedByFcm +=
        campaign
          .acceptedDevices ||
        0;

      row.failed +=
        campaign
          .rejectedDevices ||
        0;

      row.notificationOpens +=
        dynamic
          ?.openedUsers ||
        0;

      row.alertsRead +=
        dynamic
          ?.readUsers ||
        0;
    },
  );

  return {
    days,

    requestedGroupBy:
      String(
        query.groupBy ||
          "auto",
      ),

    groupBy,

    from:
      bounds.from,

    to:
      bounds.to,

    trend:
      Array.from(
        rows.values(),
      ).sort(
        (
          first,
          second,
        ) =>
          String(
            first.period,
          ).localeCompare(
            String(
              second.period,
            ),
          ),
      ),
  };
}

export async function listCampaigns({
  query = {},
}) {
  const page =
    Math.max(
      Number(
        query.page ||
          1,
      ) || 1,
      1,
    );

  const limit =
    Math.min(
      Math.max(
        Number(
          query.limit ||
            20,
        ) || 20,
        1,
      ),
      100,
    );

  const filter =
    buildCampaignFilter(
      query,
    );

  const [
    total,
    campaigns,
  ] = await Promise.all([
    NotificationCampaign
      .countDocuments(filter),

    NotificationCampaign
      .find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(
        (page - 1) *
          limit,
      )
      .limit(limit)
      .lean(),
  ]);

  const metricsMap =
    await dynamicMetricsByCampaign(
      campaigns.map(
        (campaign) =>
          campaign._id,
      ),
    );

  return {
    campaigns:
      campaigns.map(
        (campaign) =>
          attachDynamicMetrics(
            campaign,
            metricsMap.get(
              String(
                campaign._id,
              ),
            ),
          ),
      ),

    pagination: {
      page,
      limit,
      total,
      pages:
        Math.max(
          Math.ceil(
            total / limit,
          ),
          1,
        ),
    },
  };
}

export async function getCampaignDetails(
  campaignId,
) {
  if (
    !mongoose.Types
      .ObjectId.isValid(
        campaignId,
      )
  ) {
    return null;
  }

  const campaign =
    await NotificationCampaign
      .findById(
        campaignId,
      )
      .populate(
        "eventId",
        "title startAt endAt location image status",
      )
      .lean();

  if (!campaign) {
    return null;
  }

  const metricsMap =
    await dynamicMetricsByCampaign(
      [
        campaign._id,
      ],
    );

  return attachDynamicMetrics(
    campaign,
    metricsMap.get(
      String(
        campaign._id,
      ),
    ),
  );
}

export async function listCampaignRecipients({
  campaignId,
  query = {},
}) {
  if (
    !mongoose.Types
      .ObjectId.isValid(
        campaignId,
      )
  ) {
    return null;
  }

  const campaign =
    await NotificationCampaign
      .findById(
        campaignId,
      )
      .lean();

  if (!campaign) {
    return null;
  }

  if (
    !campaign
      .analyticsAvailable
  ) {
    return {
      campaign,
      recipients: [],
      pagination: {
        page: 1,
        limit: 25,
        total: 0,
        pages: 1,
      },
      message:
        "Per-user analytics are unavailable for Firebase topic sends because this backend does not store topic membership.",
    };
  }

  const page =
    Math.max(
      Number(
        query.page ||
          1,
      ) || 1,
      1,
    );

  const limit =
    Math.min(
      Math.max(
        Number(
          query.limit ||
            25,
        ) || 25,
        1,
      ),
      100,
    );

  const filter = {
    campaignId:
      campaign._id,
  };

  switch (
    query.status
  ) {
    case "accepted":
      filter.deliveryStatus =
        "sent";
      break;

    case "failed":
      filter.deliveryStatus =
        "failed";
      break;

    case "opened":
      filter.openedAt = {
        $ne: null,
      };
      break;

    case "not_opened":
      filter.openedAt =
        null;
      break;

    case "read":
      filter.read = true;
      break;

    case "unread":
      filter.read = false;
      break;

    default:
      break;
  }

  const search =
    String(
      query.search || "",
    ).trim();

  if (search) {
    const pattern =
      new RegExp(
        escapeRegex(search),
        "i",
      );

    const matchingUsers =
      await Registration
        .find({
          $or: [
            {
              name:
                pattern,
            },
            {
              email:
                pattern,
            },
            {
              phone:
                pattern,
            },
          ],
        })
        .select("_id")
        .limit(5000)
        .lean();

    filter.userId = {
      $in:
        matchingUsers.map(
          (user) =>
            user._id,
        ),
    };
  }

  const [
    total,
    notifications,
  ] = await Promise.all([
    Notification
      .countDocuments(
        filter,
      ),

    Notification
      .find(filter)
      .populate(
        "userId",
        "name email phone type",
      )
      .sort({
        createdAt: -1,
      })
      .skip(
        (page - 1) *
          limit,
      )
      .limit(limit)
      .lean(),
  ]);

  const userIds =
    notifications
      .map(
        (notification) =>
          notification.userId
            ?._id ||
          notification.userId,
      )
      .filter(Boolean);

  const deliveries =
    userIds.length > 0
      ? await NotificationDelivery
          .find({
            campaignId:
              campaign._id,

            userId: {
              $in:
                userIds,
            },
          })
          .sort({
            createdAt: 1,
          })
          .lean()
      : [];

  const deliveriesByUser =
    new Map();

  deliveries.forEach(
    (delivery) => {
      const userId =
        String(
          delivery.userId ||
            "",
        );

      if (
        !deliveriesByUser.has(
          userId,
        )
      ) {
        deliveriesByUser.set(
          userId,
          [],
        );
      }

      deliveriesByUser
        .get(userId)
        .push({
          deviceName:
            delivery.deviceName ||
            "Unknown device",

          platform:
            delivery.platform,

          installationId:
            delivery
              .installationId,

          fcmStatus:
            delivery
              .fcmStatus,

          fcmMessageId:
            delivery
              .fcmMessageId,

          errorCode:
            delivery
              .errorCode,

          errorMessage:
            delivery
              .errorMessage,

          processedAt:
            delivery
              .processedAt,
        });
    },
  );

  const recipients =
    notifications.map(
      (notification) => {
        const populatedUser =
          notification.userId &&
          typeof notification
            .userId ===
            "object" &&
          notification.userId
            ._id
            ? notification
                .userId
            : null;

        const userId =
          String(
            populatedUser
              ?._id ||
              notification.userId ||
              "",
          );

        const devices =
          deliveriesByUser.get(
            userId,
          ) || [];

        return {
          notificationId:
            notification._id,

          user: {
            id:
              userId,

            name:
              populatedUser
                ?.name ||
              "Unknown user",

            email:
              populatedUser
                ?.email ||
              "",

            phone:
              populatedUser
                ?.phone ||
              "",

            type:
              populatedUser
                ?.type ||
              "",
          },

          fcmStatus:
            notification
              .deliveryStatus ===
            "sent"
              ? "accepted"
              : notification
                    .deliveryStatus ===
                  "failed"
                ? "failed"
                : "queued",

          acceptedDevices:
            notification
              .acceptedDeviceCount ||
            0,

          rejectedDevices:
            notification
              .rejectedDeviceCount ||
            0,

          opened:
            Boolean(
              notification
                .openedAt,
            ),

          openedAt:
            notification
              .openedAt,

          openSource:
            notification
              .openSource,

          read:
            Boolean(
              notification.read,
            ),

          readAt:
            notification
              .readAt,

          failureReason:
            notification
              .failureReason ||
            "",

          devices,
        };
      },
    );

  return {
    campaign,
    recipients,

    pagination: {
      page,
      limit,
      total,
      pages:
        Math.max(
          Math.ceil(
            total / limit,
          ),
          1,
        ),
    },
  };
}
