import { QueueSettings, IQueueSettings } from '../models/QueueSettings';

// ─────────────────────────────────────────────
// Repository Class
// ─────────────────────────────────────────────

export class QueueSettingsRepository {
  private readonly DEFAULT_DEPT = 'GEN';

  /**
   * Get the settings document for a department.
   * Automatically creates one if it doesn't exist.
   * Automatically resets token counters if the date has advanced (daily reset).
   */
  async getOrInitialize(
    departmentCode: string = this.DEFAULT_DEPT,
    today: string
  ): Promise<IQueueSettings> {
    let settings = await QueueSettings.findOne({ departmentCode });

    if (!settings) {
      settings = await QueueSettings.create({
        departmentCode,
        lastResetDate: today,
        currentToken: 0,
        lastIssuedToken: 0,
      });
      return settings;
    }

    // Daily reset: if the calendar day has changed, reset all counters
    if (settings.lastResetDate !== today) {
      settings.currentToken = 0;
      settings.lastIssuedToken = 0;
      settings.lastResetDate = today;
      await settings.save();
    }

    return settings;
  }

  /**
   * Atomically increment lastIssuedToken and return the new value.
   * This is the token-generation operation — must be atomic to prevent duplicates.
   */
  async issueNextToken(
    departmentCode: string = this.DEFAULT_DEPT,
    today: string
  ): Promise<number> {
    const settings = await QueueSettings.findOneAndUpdate(
      { departmentCode },
      { $inc: { lastIssuedToken: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // If this was the first token of the day and the date is stale, initialize properly
    if (!settings.lastResetDate || settings.lastResetDate !== today) {
      await QueueSettings.updateOne(
        { departmentCode },
        { $set: { lastResetDate: today, currentToken: 0 } }
      );
    }

    return settings.lastIssuedToken;
  }

  /**
   * Update currentToken to reflect the patient now being served.
   * Called every time the receptionist calls the next patient.
   */
  async setCurrentToken(
    departmentCode: string = this.DEFAULT_DEPT,
    token: number
  ): Promise<IQueueSettings | null> {
    return QueueSettings.findOneAndUpdate(
      { departmentCode },
      { $set: { currentToken: token } },
      { new: true }
    ).exec();
  }

  /**
   * Update the average consultation time (minutes per patient).
   * Affects estimated wait time calculations for all waiting patients.
   */
  async updateAverageConsultationTime(
    departmentCode: string = this.DEFAULT_DEPT,
    minutes: number
  ): Promise<IQueueSettings | null> {
    return QueueSettings.findOneAndUpdate(
      { departmentCode },
      { $set: { averageConsultationTime: minutes } },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Open or close the queue. When closed, new patients cannot register.
   */
  async setQueueOpen(
    departmentCode: string = this.DEFAULT_DEPT,
    isOpen: boolean
  ): Promise<IQueueSettings | null> {
    return QueueSettings.findOneAndUpdate(
      { departmentCode },
      { $set: { isQueueOpen: isOpen } },
      { new: true }
    ).exec();
  }

  /**
   * Get current settings snapshot without any side effects.
   * Used for queue status queries.
   */
  async get(departmentCode: string = this.DEFAULT_DEPT): Promise<IQueueSettings | null> {
    return QueueSettings.findOne({ departmentCode }).lean().exec();
  }
}

export const queueSettingsRepository = new QueueSettingsRepository();
