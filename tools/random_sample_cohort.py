import sys
from random import sample

import pandas as pd
from numpy import full

HEADER_DISTINCT_ID = '$distinct_id'
HEADER_FIRST_SEEN = '$mp_first_event_time'
HEADER_COHORT = 'Cohort'

RANDOM_SAMPLE_PER_DAY_SIZE = 20

def main():
    """
    How to use this script:
    - Create a venv. Activate it. Install pandas in this. 
    - Create the cohort on Mixpanel for the date range you want. This cohort should be finished signup with a first time filter.
    - Add the first seen column to the visible columns.
    - Download the file from Mixpanel.
    - Copy it into this folder.
    - Run this script with `python3 random_sample_cohort.py <path_to_csv>
    - Take the results csv for this cohort
    """ 
    # Do a sanity check on arguments
    assert len(sys.argv) == 2
    path = sys.argv[1]

    # Read in the cohort
    full_cohort = pd.read_csv(path)
    print(f"The full cohort has: {len(full_cohort)} users")

    # We only need the distinct id and the first seen date
    full_cohort = full_cohort[[HEADER_DISTINCT_ID, HEADER_FIRST_SEEN]]

    # We convert the first seen to a datetime
    full_cohort[HEADER_FIRST_SEEN] = pd.to_datetime(full_cohort[HEADER_FIRST_SEEN])

    # Calculate the final day
    final_day = max(full_cohort[HEADER_FIRST_SEEN]).replace(hour=23, minute=59, second=59)
    # Then, go 28 days earlier than that to find the first day
    first_day = (final_day - pd.Timedelta('27 days')).replace(hour=0, minute=0, second=0)

    # Then, let us know that range, and confirm it's correct
    print(f"Building cohort for {first_day} to {final_day}")

    # As some users start trying to use Mito _way_ before they finish sign up, we then go through 
    # and take all users that fall into the bucket and just filter them out
    print(f'There are {(full_cohort[HEADER_FIRST_SEEN] < first_day).sum()} users who started signup before the first day. Filtering them out.')

    # Then, we cut out any users who were before the first day
    full_cohort = full_cohort[full_cohort[HEADER_FIRST_SEEN] >= first_day]
    assert (full_cohort[HEADER_FIRST_SEEN] < first_day).sum() == 0
    assert (full_cohort[HEADER_FIRST_SEEN] > final_day).sum() == 0

    # Then, we go through and put all the datetimes at the start of the day, for ease of grouping
    full_cohort[HEADER_FIRST_SEEN] = full_cohort[HEADER_FIRST_SEEN].dt.floor('D')

    # Then, we bucket users into days
    days_to_users_map = dict()
    for index, row in full_cohort.iterrows():
        id = row[HEADER_DISTINCT_ID]
        first_seen = row[HEADER_FIRST_SEEN]

        if first_seen not in days_to_users_map:
            days_to_users_map[first_seen] = []

        days_to_users_map[first_seen].append(id)
    
    # Some sanity checks on this dict
    assert len(days_to_users_map.keys()) == 28
    assert len([id for id_list in days_to_users_map.values() for id in id_list]) == len(full_cohort)

    # Find the minimum length of the values
    print(f"The minimum number new users in a day is {min(map(len, days_to_users_map.values()))}")
    print(f"The maximum number new users in a day is {max(map(len, days_to_users_map.values()))}")

    cohort_name = f"{first_day.strftime('%B %-d')} - {final_day.strftime('%B %-d')} ({final_day.strftime('%Y')}) (Retention Subset)"

    # Construct the random sample of users, and build a dictonary
    random_sample = {HEADER_DISTINCT_ID: [], HEADER_COHORT: []}
    total_missing_users = 0 
    for day, users_on_day in days_to_users_map.items():
        if len(users_on_day) < RANDOM_SAMPLE_PER_DAY_SIZE:
            print(f"{day} has only {len(users_on_day)}, taking all of them")
            random_set_of_user_ids_for_day = users_on_day
            total_missing_users += RANDOM_SAMPLE_PER_DAY_SIZE - len(users_on_day)
        else:
            random_set_of_user_ids_for_day = sample(users_on_day, RANDOM_SAMPLE_PER_DAY_SIZE)
        for id in random_set_of_user_ids_for_day:
            random_sample[HEADER_DISTINCT_ID].append(id)
            random_sample[HEADER_COHORT].append(cohort_name)

    # Check we selected the right number of users
    assert len(set(random_sample[HEADER_DISTINCT_ID])) == RANDOM_SAMPLE_PER_DAY_SIZE * 28 - total_missing_users
    assert len(random_sample[HEADER_COHORT]) == RANDOM_SAMPLE_PER_DAY_SIZE * 28 - total_missing_users

    # Then, write this to the output
    final_cohort = pd.DataFrame(random_sample)
    final_cohort.to_csv(f"{cohort_name}.csv", index=False)

    print(f"Wrote cohort {cohort_name} to {cohort_name}.csv")


if  __name__ == "__main__":
    main()