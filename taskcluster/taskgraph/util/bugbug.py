# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from __future__ import absolute_import, print_function, unicode_literals

import os
import json
import sys
import time

import requests
from mozbuild.util import memoize

from taskgraph.util.taskcluster import requests_retry_session

BUGBUG_BASE_URL = "https://bugbug.herokuapp.com"
RETRY_TIMEOUT = 8 * 60  # seconds
RETRY_INTERVAL = 10      # seconds

# Preset confidence thresholds.
CT_LOW = 0.7
CT_MEDIUM = 0.8
CT_HIGH = 0.9

GROUP_TRANSLATIONS = {
    "testing/web-platform/tests": "",
    "testing/web-platform/mozilla/tests": "/_mozilla",
}


def translate_group(group):
    for prefix, value in GROUP_TRANSLATIONS.items():
        if group.startswith(prefix):
            return group.replace(prefix, value)

    return group


class BugbugTimeoutException(Exception):
    pass


@memoize
def get_session():
    s = requests.Session()
    s.headers.update({'X-API-KEY': 'gecko-taskgraph'})
    return requests_retry_session(retries=5, session=s)


def _write_perfherder_data(lower_is_better):
    if os.environ.get("MOZ_AUTOMATION", "0") == "1":
        perfherder_data = {
            "framework": {"name": "build_metrics"},
            "suites": [
                {
                    "name": suite,
                    "value": value,
                    "lowerIsBetter": True,
                    "shouldAlert": False,
                    "subtests": [],
                }
                for suite, value in lower_is_better.items()
            ],
        }
        print(
            "PERFHERDER_DATA: {}".format(json.dumps(perfherder_data)), file=sys.stderr
        )


@memoize
def push_schedules(branch, rev):
    url = BUGBUG_BASE_URL + '/push/{branch}/{rev}/schedules'.format(branch=branch, rev=rev)
    # TODO(py3): use time.monotonic()
    start = time.clock()
    session = get_session()
    attempts = RETRY_TIMEOUT / RETRY_INTERVAL
    i = 0
    while i < attempts:
        r = session.get(url)
        r.raise_for_status()

        if r.status_code != 202:
            break

        time.sleep(RETRY_INTERVAL)
        i += 1
    end = time.clock()

    _write_perfherder_data(lower_is_better={
        'bugbug_push_schedules_time': end-start,
        'bugbug_push_schedules_retries': i,
    })

    data = r.json()
    if r.status_code == 202:
        raise BugbugTimeoutException("Timed out waiting for result from '{}'".format(url))

    if "groups" in data:
        data["groups"] = {translate_group(k): v for k, v in data["groups"].items()}

    return data
