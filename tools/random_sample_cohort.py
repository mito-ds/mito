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
    0. Create a venv. Install pandas
    1. Create the cohort on Mixpanel for the date range you want (e.g. finished signup, first time filter)
    2. Download the file from Mixpanel (MAKE SURE TO ADD THE FIRST SEEN COLUMN). 
    3. Copy it into this folder.
    4. Run this script with `python3 random_sample_cohort.py <path_to_csv>
    5. Take the results csv, and upload it to Mixpanel
    """ 
    # Do a sanity check on arguments
    assert len(sys.argv) == 3
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
    # and take all users that fall into the bucket and just put them in the first day. We also print
    # out how many users fall into this category (so if it's big, we can adjust it differently).
    print(f'There are {(full_cohort[HEADER_FIRST_SEEN] < first_day).sum()} users who started signup before the first day')

    # Then, we clip to the max and minumum values
    full_cohort[HEADER_FIRST_SEEN] = full_cohort[HEADER_FIRST_SEEN].clip(first_day, final_day)
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

    cohort_name = f"Cohort {first_day}-{final_day}"

    # Construct the random sample of users, and build a dictonary
    random_sample = {HEADER_DISTINCT_ID: [], HEADER_COHORT: []}
    for day, users_on_day in days_to_users_map.items():
        random_set_of_user_ids_for_day = sample(users_on_day, RANDOM_SAMPLE_PER_DAY_SIZE)
        for id in random_set_of_user_ids_for_day:
            random_sample[HEADER_DISTINCT_ID].append(id)
            random_sample[HEADER_COHORT].append(cohort_name)

    # Check we selected the right number of users
    assert len(set(random_sample[HEADER_DISTINCT_ID])) == RANDOM_SAMPLE_PER_DAY_SIZE * 28
    assert len(random_sample[HEADER_COHORT]) == RANDOM_SAMPLE_PER_DAY_SIZE * 28

    # Then, write this to the output
    final_cohort = pd.DataFrame(random_sample)
    final_cohort.to_csv(f"{cohort_name}.csv", index=False)

    print(f"Wrote cohort {cohort_name} to {cohort_name}.csv")





if  __name__ == "__main__":
    main()
