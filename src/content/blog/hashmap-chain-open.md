---
author: Lori
pubDatetime: 2025-01-24T19:55:25.584Z
modDatetime:
title: HashMap, Between Separate Chaining and Open Addressing, the What and the How
slug: hashmap-chain-open
featured: true
draft: false
tags:
  - data-structure
  - c
description:
  HashMap, a data structure that efficiently stores key-value pairs, also a data structured loved by programmer because of its advantage with fast lookup, insertion, and deletion which typically have an average time complexity of O(1). It uses hash function to compute an index into an array of buckets where the value can be found.
---

HashMap, a data structure that efficiently stores key-value pairs, also a data structured loved by programmer because of its advantage with fast lookup, insertion, and deletion which typically have an average time complexity of O(1). It uses hash function to compute an index into an array of buckets where the value can be found.

We know that in most programming language, has provide HashMap built-in implementation, but understanding the underlying concept principles might deepen your knowledge and satisfy your curiosity to get to know the thing under the hood of your favorite language 😜

## Hashing and Collisions

### Hashing

To implement HashMap data structure we need a hashing function to determine where each key-value pair will be stored in its respective array. There are several hashing function usually used in HashMap, you can check more in this [page](http://www.cse.yorku.ca/~oz/hash.html) but I will show you one of them which is the `djb2` which takes a string key as input. In below code, it initializes `hash` variable with the value of `5381` , a “magic number” that as far as I can found chosen because of these reasons:

1. odd number
2. prime number
3. deficient number ([more detail](https://en.wikipedia.org/wiki/Deficient_number))

The algorithm the shifts `hash` 5 positions to left and adds it to itself, which is equivalent of multiplying the hash by 33, that’s why it also called `33 times hashing` . Finally, it adds each character of the key to the value hash.

```c
unsigned long hash(const char *str) {
    unsigned long hash = 5381;
    int c;
    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c;
    }

    return hash;
}
```

### Collisions

Since the hash function could potentially map infinite set of keys to a finite set of indices, collusions might be occur. Collision happens when two different keys produce same hash code and share the same bucket. To handle collision, two common strategies are **Separate** **Chaining and Open Addressing**.

## Separate Chaining

In separate chaining, each bucket of the hash table stored a linked list of key value-pair. When collision occurs, the new key-value pairs append in the linked list as the head of the linked list.

### The Step-By-Step

Let me give you example, supposed you have the HashMap with the capacity of 10 it means buckets with 10 capacity:

`Buckets: [ NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL ]`

and then inserting a key apple with value 123`("apple", 123)` , assume `hash("apple") % 10`  is 6, this node will be placed in index 6

`Buckets: [ NULL, NULL, NULL, NULL, NULL, NULL, ("apple", 123) -> NULL, NULL, NULL ]`

now we inserting new key-value pair of `("grape", 32)` let’s assume `hash("grape") % 10` is 6, it’s collision with `"apple"` , in Separate Chaining, this newly node will append to the existing linked list in index 6

`Buckets: [ NULL, NULL, NULL, NULL, NULL, NULL, ("grape", 32) -> ("apple", 123) -> NULL, NULL, NULL ]`

> **_NOTE:_**  The usage of modulo operator (%) to get the valid index within the bounds of the buckets array.

### The Code

Now, let’s see the example code

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct KeyValue {
    char *key;
    int value;
    struct KeyValue *next;
} KeyValue;

typedef struct HashMap {
    KeyValue **buckets;
    int capacity;
    int size;
} HashMap;

unsigned long hash(const char *str) {
    unsigned long hash = 5381;
    int c;
    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c;
    }

    return hash;
}

void insert(HashMap *map, const char *key, int value) {
    unsigned long index = hash(key) % map->capacity;
    KeyValue *newNode = malloc(sizeof(KeyValue));
    newNode->key = strdup(key);
    newNode->value = value;
    newNode->next = map->buckets[index];
    map->buckets[index] = newNode;
    map->size++;
}

int search(HashMap *map, const char *key, int *found) {
    unsigned long index = hash(key) % map->capacity;
    KeyValue *current = map->buckets[index];
    while (current) {
        if(strcmp(current->key, key) == 0) {
            *found = 1;
            return current->value;
        }
        current = current->next;
    }
    *found = 0;
    return 0;
}
```

In the above code, in `insert` function, this where the Separate Chaining happen, we create a new node so if the collision occurs the new key-value pairs needs to be stored as linked list in that bucket.

In this code, if the existing bucket with the same index is empty, the `next` value will be `NULL`, else it will put the existing key-value pairs to the `next` and then replace the current index of the buckets with new node we’ve created which has the linked to other key-value pairs.

```c
newNode->next = map->buckets[index];
map->buckets[index] = newNode;
```

The full implementation can check in [here](https://github.com/chud-lori/hashmap-implementation)

### Pros

1. It’s simple to implement, linked list data structure is easy to implement and manage
2. Due to the linked list, it could handle load factor greater than 1
3. Handle collision gracefully as the load factor increases, because it resolved by appending to the linked list

### Cons

1. Memory Overhead, each node in linked list requires memory allocation for the next pointer
2. In Linked list, nodes are scattered in memory, so it’s not cache friendly
3. Slower when traversing the linked list than accessing contiguous memory like in Open Addressing

## Open Addressing

In Open Addressing, all key-value pairs directly stored in the buckets instead of using linked list. When a collision occurs, the algorithm probes (searches) for the next available slot in the buckets.

### Probing

There are several types of probing, few of the most common are:

1. **Linear Probing**

    When collision occurs, check the next slot, and it will keep checking until found an available slot.

    Formula: `index = (hash(key) + i) % capacity` where `i` is the probe number or the looping index

2. **Quadratic Probing**

    When collision occurs, check slots at increasing intervals  like `1², 2², 3²` .

    Formula: `index = (hash(key) + i²) % capacity)`

3. **Double Hashing**

    When collision occurs, it uses a second hash function to determine the step size for probing.

    Formula: `index = (hash1(key) + i * hash2(key)) % capacity`


### The Step-By-Step

Let’s focus on Linear Probing,

Let’s say we have Hash Map with capacity of 10.

```c
Index: 0   1   2   3   4   5   6   7   8   9
       -   -  -  -   -   -   -   -   -   -
```

Inserting `“cat”` , assume `hash("cat") % 10 = 3`

```c
Index: 0   1   2   3   4   5   6   7   8   9
       -   -  -  cat   -   -   -   -   -   -
```

Inserting `"dog"` , assume `hash("dog") % 10 = 3`

since index `3` already occupied, the collision occurs. Using Linear Probing it checks the next slot until found an available slot.

```c
Index: 0   1   2   3   4   5   6   7   8   9
       -   -  -  cat   dog   -   -   -   -   -
```

The searching and deletion have the same logic using the formula of Linear Probing to found the index.

### The Code

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define TABLE_SIZE 10

typedef struct HashEntry {
    char *key;
    int value;
    int is_occupied; // flag indicate the slot occupied
    int is_deleted; // flag indicate the slot has been deleted
} HashEntry;

typedef struct HashMap {
    HashEntry table[TABLE_SIZE];
} HashMap;

unsigned long hash(const char *str) {
    unsigned long hash = 5381;
    int c;
    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c;
    }

    return hash;
}

void init_hashmap(HashMap *map) {
    for (int i = 0; i < TABLE_SIZE; i++) {
        map->table[i].key = NULL;
        map->table[i].is_occupied = 0;
        map->table[i].is_deleted = 0;
    }
}

void insert(HashMap *map, const char *key, int value) {
    unsigned long index = hash(key) % TABLE_SIZE;

    for (int i = 0; i < TABLE_SIZE; i++) {
        int try = (index + i) % TABLE_SIZE; // linear probing
        if (!map->table[try].is_occupied || map->table[try].is_deleted) {
            map->table[try].key = strdup(key);
            map->table[try].value = value;
            map->table[try].is_occupied = 1;
            map->table[try].is_deleted = 0;
            printf("Inserted (%s, %d) at index %d\n", key, value, try);
            return;
        }
    }

    printf("Hash table is full. Cannot insert (%s, %d)\n", key, value);

}

int search(HashMap *map, const char *key, int *found) {
    unsigned long index = hash(key) % TABLE_SIZE;

    for (int i = 0; i < TABLE_SIZE; i++) {
        int try = (index + i) % TABLE_SIZE;
        if (map->table[try].is_occupied) {
            if (strcmp(map->table[try].key, key) == 0 && !map->table[try].is_deleted) {
                *found = 1;
                return map->table[try].value;
            }
        } else if (!map->table[try].is_occupied && !map->table[try].is_deleted) {
            // There’s no point in continuing the search further because, in linear probing, keys are always inserted into the first available slot.
            break;
        }
    }

    *found = 0;
    return 0;
}

void delete(HashMap *map, const char *key) {
    unsigned long index = hash(key) % TABLE_SIZE;

    for (int i = 0; i < TABLE_SIZE; i++) {
        int try = (index + i) % TABLE_SIZE;

        if (map->table[try].is_occupied) {
            if (strcmp(map->table[try].key, key) == 0 && !map->table[try].is_deleted) {
                map->table[try].is_deleted = 1;
                map->table[try].is_occupied = 0;
                printf("deleted key %s at index %d", key, try);
                return;
            }
        } else if (!map->table[try].is_occupied && !map->table[try].is_deleted) {
            printf("Key not found");
            return;
        }
    }

    printf("Key not found");
}
```

As shown in the function `search` and `delete` the probing stop when the next slot is not occupied because in linear probing, keys are always inserted in the first available slot.

The full implementation can check in [here](https://github.com/chud-lori/hashmap-implementation)

### Pros

1. Efficient memory compare to Separate Chaining since all data stored in the array
2. It improves cache performance since data stored in contiguous memory
3. Handle collision gracefully as the load factor increases, because it resolved by appending to the linked list

### Cons

1. With high Load Factor, the number of probes to find available slots grows, leads to slower performance
2. More complex implementation when handling deletion compared to Separate Chaining

## Load Factor

When the Hash Map initialized, the size of the hash table is defined, we used to call it as **Bucket Count**, refers to the total of numbers of **buckets** in the hash table. The size is fixed size, but it could be dynamically resized as the number of key-value pairs (element) grows.

The ratio of the number of elements in the hash map to the bucket count is called **Load Factor.** The formula to find the Load Factor is:

```latex
Load Factor = Number of elements / Bucket count
```

### Load Factor Threshold

The threshold is predefined value to determines when the hash map should be resize, usually it’s set to 0.75, let’s say if the the number of elements is 100 while the bucket count is 128, `100/128` it’s around 0.78, it will trigger to resize the bucket count.

Why it’s important to resize the bucket count? When the Load Factor is high, close to 1, it could leads to collision due to the buckets getting more filled up. Also slower the performance because of the element  placed more closely.

But, when the Load Factor is low, close to 0, the hash map has a lot of empty slots which could be memory-consuming.

That’s all, thanks for visit and reading this, cheers 🍻🍻
