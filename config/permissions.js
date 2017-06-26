// List of all permissions
module.exports.list = {
  'ADMIN-ACCESS': {
    controller: 'admin/dashboard',
    action: 'admin'
  },
  'ADMIN-ACCESS_DASHBOARD': {
    controller: 'admin/dashboard',
    action: 'index'
  },
  'ADMIN-VIEW_TICKETS': {
    controller: 'admin/ticket',
    action: 'index'
  },
  'ADMIN-CLOSE_TICKET': {
    controller: 'admin/ticket',
    action: 'close'
  },
  'ADMIN-VIEW_TICKET': {
    controller: 'admin/ticket',
    action: 'view'
  },
  'ADMIN-EDIT_CATEGORY_TICKET': {
    controller: 'admin/ticket',
    action: 'editcategory'
  },
  'ADMIN-EDIT_STATE_TICKET': {
    controller: 'admin/ticket',
    action: 'editstate'
  },
  'ADMIN-TAKE_TICKET': [
    {
      controller: 'admin/ticket',
      action: 'take'
    },
    {
      controller: 'admin/ticket',
      action: 'untake'
    }
  ],
  'ADMIN-REPLY_TICKET': {
    controller: 'admin/ticket',
    action: 'reply'
  },
  'ADMIN-FIND_TICKETS': {
    controller: 'admin/ticket',
    action: 'find'
  },
  'ADMIN-MANAGE_SETTINGS': [
    {
      controller: 'admin/dashboard',
      action: 'settings'
    },
    {
      controller: 'admin/dashboard',
      action: 'updatesettings'
    }
  ],
  'ADMIN-FIND_LICENSE': [
    {
      controller: 'admin/license',
      action: 'find'
    },
    {
      controller: 'admin/license',
      action: 'switchtolicenseid'
    },
    {
      controller: 'admin/license',
      action: 'findpage'
    }
  ],
  'ADMIN-VIEW_LICENSE': {
    controller: 'admin/license',
    action: 'view'
  },
  'ADMIN-SUSPEND_LICENSE': {
    controller: 'admin/license',
    action: 'suspend'
  },
  'ADMIN-UNSUSPEND_LICENSE': {
    controller: 'admin/license',
    action: 'unsuspend'
  },
  'ADMIN-GET_DEBUG_LICENSE': {
    controller: 'admin/license',
    action: 'getdebug'
  },
  'ADMIN-FIND_USER': [
    {
      controller: 'admin/user',
      action: 'findpage'
    },
    {
      controller: 'admin/user',
      action: 'find'
    }
  ],
  'ADMIN-VIEW_USER': {
    controller: 'admin/user',
    action: 'view'
  },
  'ADMIN-UPDATE_INDEX': {
    controller: 'admin/update',
    action: 'index'
  },
  'ADMIN-UPDATE_ADD': {
    controller: 'admin/update',
    action: 'add'
  },
  'ADMIN-UPDATE_EDIT': {
    controller: 'admin/update',
    action: 'edit'
  },
  'ADMIN-VIEW_STATS': {
    controller: 'admin/statistic'
  },
  'ADMIN-VIEW_PAYMENTS_LIST': {
    controller: 'admin/payment'
  },
  'ADMIN-VIEW_API_LOGS': [
    {
      controller: 'admin/api',
      action: 'log'
    },
    {
      controller: 'admin/api',
      action: 'getlogs'
    }
  ],
  'ADMIN-MANAGE_FAQ': [
    {
      controller: 'admin/api',
      action: 'faq'
    },
    {
      controller: 'admin/api',
      action: 'addquestion'
    },
    {
      controller: 'admin/api',
      action: 'removequestion'
    },
    {
      controller: 'admin/api',
      action: 'editquestion'
    }
  ],
  'ADMIN-MANAGE_DEVELOPERS': {
    controller: 'admin/developer'
  }
}

// Access per role of all permissions
module.exports.access = {
  'USER': [],
  'DEVELOPER': [],
  'MOD': [
    // 'ADMIN-ACCESS_DASHBOARD',
    'ADMIN-VIEW_TICKETS',
    'ADMIN-CLOSE_TICKET',
    'ADMIN-VIEW_TICKET',
    'ADMIN-EDIT_CATEGORY_TICKET',
    'ADMIN-EDIT_STATE_TICKET',
    'ADMIN-TAKE_TICKET',
    'ADMIN-REPLY_TICKET',
    'ADMIN-FIND_TICKETS',
    'ADMIN-MANAGE_SETTINGS',
    'ADMIN-FIND_LICENSE',
    // 'ADMIN-SUSPEND_LICENSE',
    // 'ADMIN-UNSUSPEND_LICENSE',
    'ADMIN-GET_DEBUG_LICENSE',
    'ADMIN-VIEW_LICENSE',
    'ADMIN-FIND_USER',
    'ADMIN-VIEW_USER',
    // 'ADMIN-GET_SQL_DUMP_HOSTING',
    // 'ADMIN-UPDATE_INDEX',
    // 'ADMIN-UPDATE_ADD',
    // 'ADMIN-UPDATE_EDIT',
    // 'ADMIN-VIEW_STATS',
    // 'ADMIN-VIEW_PAYMENTS_LIST',
    'ADMIN-VIEW_API_LOGS',
    'ADMIN-MANAGE_FAQ',
    // 'ADMIN-MANAGE_DEVELOPERS',
    'ADMIN-ACCESS'
  ],
  'ADMIN': [
    'ADMIN-ACCESS_DASHBOARD',
    'ADMIN-VIEW_TICKETS',
    'ADMIN-CLOSE_TICKET',
    'ADMIN-VIEW_TICKET',
    'ADMIN-EDIT_CATEGORY_TICKET',
    'ADMIN-EDIT_STATE_TICKET',
    'ADMIN-TAKE_TICKET',
    'ADMIN-REPLY_TICKET',
    'ADMIN-FIND_TICKETS',
    'ADMIN-MANAGE_SETTINGS',
    'ADMIN-FIND_LICENSE',
    'ADMIN-SUSPEND_LICENSE',
    'ADMIN-UNSUSPEND_LICENSE',
    'ADMIN-GET_DEBUG_LICENSE',
    'ADMIN-VIEW_LICENSE',
    'ADMIN-FIND_USER',
    'ADMIN-VIEW_USER',
    // 'ADMIN-UPDATE_INDEX',
    // 'ADMIN-UPDATE_ADD',
    // 'ADMIN-UPDATE_EDIT',
    'ADMIN-VIEW_STATS',
    'ADMIN-VIEW_PAYMENTS_LIST',
    'ADMIN-VIEW_API_LOGS',
    'ADMIN-MANAGE_FAQ',
    // 'ADMIN-MANAGE_DEVELOPERS',
    'ADMIN-ACCESS'
  ],
  'FOUNDER': ['*']
}
