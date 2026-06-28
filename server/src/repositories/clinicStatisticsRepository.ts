import { ClinicStatistics, IClinicStatistics, ClinicStatisticsDocument } from '../models/ClinicStatistics';

// ─────────────────────────────────────────────
// Repository Class
// ─────────────────────────────────────────────

export class ClinicStatisticsRepository {
  private readonly DEFAULT_DEPT = 'GEN';

  /**
   * Get today's statistics document, creating it if it doesn't exist.
   * Uses atomic upsert to avoid race conditions on concurrent first-access.
   */
  async getOrInitializeForToday(
    departmentCode: string = this.DEFAULT_DEPT,
    today: string
  ): Promise<ClinicStatisticsDocument> {
    return ClinicStatistics.findOneAndUpdate(
      { date: today, departmentCode },
      {
        $setOnInsert: {
          date: today,
          departmentCode,
          lastResetDate: today,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec() as Promise<ClinicStatisticsDocument>;
  }

  /**
   * Increment the total patient count when a new patient joins the queue.
   */
  async incrementTotal(
    departmentCode: string = this.DEFAULT_DEPT,
    today: string
  ): Promise<void> {
    await ClinicStatistics.findOneAndUpdate(
      { date: today, departmentCode },
      { $inc: { totalPatientsToday: 1 } },
      { upsert: true, setDefaultsOnInsert: true }
    ).exec();
  }

  /**
   * Record a completed consultation.
   * Updates the completed count and recalculates the rolling average consultation time.
   *
   * @param consultationMinutes - Duration from calledAt to completedAt in minutes
   */
  async recordCompletion(
    departmentCode: string = this.DEFAULT_DEPT,
    today: string,
    consultationMinutes: number
  ): Promise<ClinicStatisticsDocument> {
    // Step 1: Increment counts atomically
    const stats = await ClinicStatistics.findOneAndUpdate(
      { date: today, departmentCode },
      {
        $inc: {
          completedPatientsToday: 1,
          totalConsultationMinutes: consultationMinutes,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec() as ClinicStatisticsDocument;

    // Step 2: Compute and persist rolling average
    const newAvg =
      stats.completedPatientsToday > 0
        ? Math.round(stats.totalConsultationMinutes / stats.completedPatientsToday)
        : 0;

    return ClinicStatistics.findOneAndUpdate(
      { date: today, departmentCode },
      { $set: { averageActualConsultationTime: newAvg } },
      { new: true }
    ).exec() as Promise<ClinicStatisticsDocument>;
  }

  /**
   * Record a no-show event.
   */
  async recordNoShow(
    departmentCode: string = this.DEFAULT_DEPT,
    today: string
  ): Promise<void> {
    await ClinicStatistics.findOneAndUpdate(
      { date: today, departmentCode },
      { $inc: { noShowPatientsToday: 1 } },
      { upsert: true, setDefaultsOnInsert: true }
    ).exec();
  }

  /**
   * Update the peak queue length if the current waiting count exceeds the recorded peak.
   * Called after every patient addition.
   */
  async updatePeakQueueLength(
    departmentCode: string = this.DEFAULT_DEPT,
    today: string,
    currentWaitingCount: number
  ): Promise<void> {
    await ClinicStatistics.findOneAndUpdate(
      { date: today, departmentCode, peakQueueLength: { $lt: currentWaitingCount } },
      { $set: { peakQueueLength: currentWaitingCount } },
      { upsert: false } // Only update if the condition is met — no upsert needed here
    ).exec();
  }

  /**
   * Get today's full statistics snapshot.
   */
  async getToday(
    departmentCode: string = this.DEFAULT_DEPT,
    today: string
  ): Promise<IClinicStatistics | null> {
    return ClinicStatistics.findOne({ date: today, departmentCode }).lean().exec();
  }

  /**
   * Get statistics for a date range (historical dashboard).
   * Results are sorted by date descending (most recent first).
   */
  async getRange(
    departmentCode: string = this.DEFAULT_DEPT,
    fromDate: string,
    toDate: string
  ): Promise<IClinicStatistics[]> {
    return ClinicStatistics.find({
      departmentCode,
      date: { $gte: fromDate, $lte: toDate },
    })
      .sort({ date: -1 })
      .lean()
      .exec();
  }
}

export const clinicStatisticsRepository = new ClinicStatisticsRepository();
