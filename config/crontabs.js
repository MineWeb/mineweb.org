/**
 * Scheduler
 *
 * @description :: Scheduler for background task
 */

module.exports.crontabs = [
	{
    interval : '0 12 * * *',
    task : function () {
			HostingService.checkEnded()
    }
	}
];
