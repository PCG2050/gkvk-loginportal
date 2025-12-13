# Backend Fix Required: isDeactivated Field Not Persisting

## 🔴 **Problem**

The frontend sends `isDeactivated: true` to the backend, the backend responds with success, BUT the database is not actually updated. On refresh, all trainers still show `isDeactivated: false`.

## 📊 **Evidence**

**Frontend Request (Correct):**
```json
PATCH /api/trainers/88
{
  "firstName": "User",
  "lastName": "Name",
  "email": "user1@coh.com",
  "phone": "5383131413",
  "role": 1,
  "isDeactivated": true,  // ✅ Field is sent correctly
  "organization": 1,
  "qualification": "BE",
  "dateOfJoining": "0001-01-01",
  "dateOfBirth": "0001-01-01",
  "gender": 0,
  "employmentType": 0,
  "organizationUnitLocationIds": []
}
```

**Backend Response:**
```json
{
  "isSuccess": true,
  "successMessage": "Trainer updated successfully",
  "errorStatus": 0
}
```

**Database Reality (Problem):**
```json
GET /api/trainers/with-assignments
{
  "trainerId": 88,
  "isDeactivated": false  // ❌ Still false - not updated!
}
```

## 🔍 **Root Cause**

The backend `UpdateUserAsync` or `UpdateTrainerAsync` method is **NOT updating** the `isDeactivated` field in the database, even though it's being sent in the request.

## 🛠️ **How to Fix (Backend)**

### Step 1: Locate the Update Method

Find the file that contains the trainer update logic:

**Possible locations:**
```
backend/Application/Services/UserService.cs
backend/Application/Services/TrainerService.cs
backend/Infrastructure/Repositories/UserRepository.cs
```

**Method to find:**
```csharp
public async Task<ServiceResult> UpdateUserAsync(UserUpdateDto dto)
// OR
public async Task<ServiceResult> UpdateTrainerAsync(int trainerId, UserUpdateDto dto)
```

### Step 2: Check Current Implementation

The method probably looks like this (BROKEN):

```csharp
public async Task<ServiceResult> UpdateUserAsync(UserUpdateDto dto)
{
    var user = await _context.Users.FindAsync(dto.Id);
    if (user == null)
        return ServiceResult.Failure("User not found");

    // ❌ PROBLEM: isDeactivated is NOT being updated
    user.FirstName = dto.FirstName;
    user.LastName = dto.LastName;
    user.Email = dto.Email;
    user.Phone = dto.Phone;
    user.Qualification = dto.Qualification;
    user.DateOfBirth = dto.DateOfBirth;
    user.DateOfJoining = dto.DateOfJoining;
    user.Gender = dto.Gender;
    user.EmploymentType = dto.EmploymentType;

    // Missing: user.IsDeactivated = dto.IsDeactivated;

    await _context.SaveChangesAsync();
    return ServiceResult.Success("User updated successfully");
}
```

### Step 3: Add the Missing Field

**Fix by adding this line:**

```csharp
public async Task<ServiceResult> UpdateUserAsync(UserUpdateDto dto)
{
    var user = await _context.Users.FindAsync(dto.Id);
    if (user == null)
        return ServiceResult.Failure("User not found");

    user.FirstName = dto.FirstName;
    user.LastName = dto.LastName;
    user.Email = dto.Email;
    user.Phone = dto.Phone;
    user.Qualification = dto.Qualification;
    user.DateOfBirth = dto.DateOfBirth;
    user.DateOfJoining = dto.DateOfJoining;
    user.Gender = dto.Gender;
    user.EmploymentType = dto.EmploymentType;

    // ✅ ADD THIS LINE:
    user.IsDeactivated = dto.IsDeactivated;

    await _context.SaveChangesAsync();
    return ServiceResult.Success("User updated successfully");
}
```

### Step 4: Verify UserUpdateDto Has the Field

Check `Application/Models/UserUpdateDto.cs`:

```csharp
public class UserUpdateDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public int Role { get; set; }
    public int Organization { get; set; }
    public string Qualification { get; set; }
    public DateTime DateOfBirth { get; set; }
    public DateTime DateOfJoining { get; set; }
    public int Gender { get; set; }
    public int EmploymentType { get; set; }

    // ✅ ENSURE THIS EXISTS:
    public bool IsDeactivated { get; set; }

    public List<int> OrganizationUnitLocationIds { get; set; }
}
```

## 🔍 **Alternative: Using AutoMapper**

If the backend uses AutoMapper, check the mapping profile:

**File:** `Application/Mappings/MappingProfile.cs`

```csharp
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<UserUpdateDto, User>()
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => src.Phone))
            // ... other fields ...

            // ✅ ADD THIS LINE:
            .ForMember(dest => dest.IsDeactivated, opt => opt.MapFrom(src => src.IsDeactivated));
    }
}
```

## 🧪 **How to Test the Fix**

1. **Add logging in the backend:**
```csharp
public async Task<ServiceResult> UpdateUserAsync(UserUpdateDto dto)
{
    Console.WriteLine($"📥 Received IsDeactivated: {dto.IsDeactivated}");

    var user = await _context.Users.FindAsync(dto.Id);

    user.IsDeactivated = dto.IsDeactivated;

    Console.WriteLine($"💾 Saving IsDeactivated: {user.IsDeactivated}");

    await _context.SaveChangesAsync();

    Console.WriteLine($"✅ Saved. Verifying...");
    var saved = await _context.Users.FindAsync(dto.Id);
    Console.WriteLine($"✅ Database value: {saved.IsDeactivated}");

    return ServiceResult.Success("User updated successfully");
}
```

2. **Make a request from frontend**
3. **Check backend logs** - You should see:
   ```
   📥 Received IsDeactivated: True
   💾 Saving IsDeactivated: True
   ✅ Saved. Verifying...
   ✅ Database value: True
   ```

4. **Refresh the frontend** - Trainer should now show as inactive

## 📝 **Quick Checklist**

- [ ] Find `UpdateUserAsync` or `UpdateTrainerAsync` method
- [ ] Check if `user.IsDeactivated = dto.IsDeactivated;` exists
- [ ] If missing, add it
- [ ] Verify `UserUpdateDto` has `IsDeactivated` property
- [ ] If using AutoMapper, check mapping profile includes `IsDeactivated`
- [ ] Test the fix
- [ ] Verify database is actually updated

## 🎯 **Expected Outcome**

After fixing the backend:

1. Frontend sends `isDeactivated: true`
2. Backend logs: "Received IsDeactivated: True"
3. Database updates: `User.IsDeactivated = true`
4. Frontend refreshes: Trainer disappears (filtered out as inactive)
5. Check "Show Inactive Trainers": Trainer appears with "Inactive" label
6. Click toggle again: Trainer reactivates successfully

## 📧 **Common Backend Files to Check**

```
backend/
├── Application/
│   ├── Services/
│   │   ├── UserService.cs ⭐ MOST LIKELY HERE
│   │   ├── TrainerService.cs
│   │   └── Common/
│   ├── Models/
│   │   └── UserUpdateDto.cs ⭐ CHECK THIS TOO
│   └── Mappings/
│       └── MappingProfile.cs (if using AutoMapper)
├── Infrastructure/
│   └── Repositories/
│       └── UserRepository.cs
└── WebApi/
    └── Controllers/
        └── TrainerController.cs (delegates to service)
```

---

**The frontend is 100% correct. The backend needs this one line:**
```csharp
user.IsDeactivated = dto.IsDeactivated;
```
